import * as Effects from 'redux-saga/effects';
import { gitLabActions as actions, gitLabActions, LOCALSTORAGE_KEY } from '.';
import { globalActions } from 'app/data/globalSlice';
import * as API from 'app/apis/gitlab';
import {
  GitLabEvent,
  GitLabGroup,
  GitLabMR,
  GitLabPipeline,
  GitLabProject,
  GitLabUserData,
  GroupName,
  MrId,
  ProjectId,
} from 'app/apis/gitlab/types';
import * as PersistanceAPI from 'app/apis/persistance';
import {
  selectGitLab,
  selectGroups,
  selectToken,
  selectConfigured,
  selectUrl,
  selectListenedGroups,
  selectAllMrs,
  selectProjects,
  selectMrsUserAssigned,
  selectProjectsByGroup,
  selectPipelinesToReload,
  selectJobsToPlay,
  selectMrsByGroup,
} from './selectors';
import {
  all,
  fork,
  join,
  spawn,
  takeEvery,
  takeLeading,
} from 'redux-saga/effects';
import moment from 'moment';

const { select, call, put, delay } = Effects;

/*
 * Pure Data Loaders
 */

function* getUserInfo() {
  const token: string = yield select(selectToken);
  const url: string = yield select(selectUrl);
  const loadingId = '[GitLab] getUserInfo';
  yield put(globalActions.addLoader({ id: loadingId }));

  // Get user data
  try {
    const userInfo: GitLabUserData = yield call(API.getUserInfo, url, token);
    yield put(actions.setUserId(userInfo.id));
    yield put(actions.setUserData(userInfo));
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        globalActions.addErrorNotification(`[GitLab] ${error.message}`),
      );
    } else {
      yield put(globalActions.addErrorNotification(`[GitLab] Unknown Error`));
    }
  } finally {
    yield put(globalActions.removeLoader({ id: loadingId }));
  }
}

function* getGroups() {
  const token: string = yield select(selectToken);
  const url: string = yield select(selectUrl);
  const loadingId = '[GitLab] getGroups';
  yield put(globalActions.addLoader({ id: loadingId }));

  // Get Groups
  try {
    const groups: GitLabGroup[] = yield call(API.getGroups, url, token);
    yield put(actions.setGroups(groups));
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        globalActions.addErrorNotification(`[GitLab] ${error.message}`),
      );
    } else {
      yield put(globalActions.addErrorNotification(`[GitLab] Unknown Error`));
    }
  } finally {
    yield put(globalActions.removeLoader({ id: loadingId }));
  }
}

function* loadProjectsForGroup(
  groups: GitLabGroup[],
  groupName: string,
  url: string,
  token: string,
) {
  if (!groupName || !groups || groups.length <= 0) return;
  const group = groups.find(group => group.full_name === groupName);
  if (!group) return;
  try {
    const projects: GitLabProject[] = yield call(
      API.getProjectsForGroup,
      url,
      token,
      group.id,
      {
        include_subgroups: true,
        with_shared: false,
      },
    );
    yield put(
      actions.setProjects({ items: projects, assoicatedId: groupName }),
    );
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        globalActions.addErrorNotification(`[GitLab] ${error.message}`),
      );
    } else {
      yield put(globalActions.addErrorNotification(`[GitLab] Unknown Error`));
    }
  }
}

function* getProjects() {
  const token: string = yield select(selectToken);
  const url: string = yield select(selectUrl);
  const listenedGroups: string[] = yield select(selectListenedGroups);
  let groups: GitLabGroup[] = yield select(selectGroups);

  if (listenedGroups.length <= 0) return;
  if (groups.length <= 0) return;

  const loadingId = '[GitLab] getProjects';
  yield put(globalActions.addLoader({ id: loadingId }));

  const tasks: any[] = [];
  for (let groupName of listenedGroups) {
    const task = yield fork(
      loadProjectsForGroup,
      groups,
      groupName,
      url,
      token,
    );
    tasks.push(task);
  }
  yield join(tasks); // wait for all tasks to finish
  yield put(globalActions.removeLoader({ id: loadingId }));
}

function* loadPipelinesForProject(
  project: GitLabProject,
  mrs: GitLabMR[],
  url: string,
  token: string,
) {
  try {
    const pipelines: GitLabPipeline[] = yield call(
      API.getPipelines,
      url,
      token,
      project.id,
      mrs,
    );
    return pipelines;
  } catch (error) {
    return [];
  }
}

function* loadPipelinesForGroup(
  groupName: GroupName,
  mrs: GitLabMR[],
  projects: GitLabProject[],
  projectsByGroup: Map<GroupName, ProjectId[]>,
  mrsByGroup: Map<GroupName, MrId[]>,
  url: string,
  token: string,
) {
  // Get all projects in the current group
  const projectIds = projectsByGroup.get(groupName);
  if (!projectIds || projectIds.length <= 0) return [];
  const groupProjects = projects.filter(project =>
    projectIds.includes(project.id),
  );
  if (!groupProjects || groupProjects.length <= 0) return [];

  // Get all MRs for the current group
  const mrIds = mrsByGroup.get(groupName);
  if (!mrIds || mrIds.length <= 0) return;
  const groupMrs = mrs.filter(mr => mrIds.includes(mr.id));
  if (!groupMrs || groupMrs.length <= 0) return [];

  // call loadPipelinesForProject
  const loadingId = `[GitLab] getPipelines ${groupName}`;
  yield put(globalActions.addLoader({ id: loadingId }));

  let tasks: any[] = [];
  // Parallelise all calls for each project in this group
  for (let project of groupProjects) {
    if (project.archived || !project.jobs_enabled) continue;
    const projectMRs = groupMrs.filter(mr => mr.project_id === project.id);
    const task = yield fork(
      loadPipelinesForProject,
      project,
      projectMRs,
      url,
      token,
    );
    tasks.push(task);
  }
  const taskResults: any[] = yield join(tasks);

  yield put(globalActions.removeLoader({ id: loadingId }));
  yield put(
    gitLabActions.setPipelines({
      items: taskResults.flat(),
      assoicatedId: groupName,
    }),
  );
}

function* getPipelines() {
  const listenedGroups: string[] = yield select(selectListenedGroups);
  if (listenedGroups.length <= 0) return;

  const token: string = yield select(selectToken);
  const url: string = yield select(selectUrl);
  const projectsByGroup: Map<GroupName, ProjectId[]> = yield select(
    selectProjectsByGroup,
  );
  const mrsByGroup: Map<GroupName, MrId[]> = yield select(selectMrsByGroup);
  const mrs: GitLabMR[] = yield select(selectAllMrs);
  const projects: GitLabProject[] = yield select(selectProjects);

  for (let groupName of listenedGroups) {
    if (!groupName) continue;
    yield fork(
      loadPipelinesForGroup,
      groupName,
      mrs,
      projects,
      projectsByGroup,
      mrsByGroup,
      url,
      token,
    );
  }
}

function* getUserAssignedMrs() {
  const token: string = yield select(selectToken);
  const url: string = yield select(selectUrl);
  const loadingId = '[GitLab] getUserAssignedMRs';
  yield put(globalActions.addLoader({ id: loadingId }));

  try {
    const mrsUserAssigned = yield call(API.getMergeRequests, url, token, {
      scope: 'assigned_to_me',
      order_by: 'updated_at',
      sort: 'desc',
    });
    yield put(actions.setMrs({ mrs: mrsUserAssigned }));
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        globalActions.addErrorNotification(`[GitLab] ${error.message}`),
      );
    } else {
      yield put(globalActions.addErrorNotification(`[GitLab] Unknown Error`));
    }
  } finally {
    yield put(globalActions.removeLoader({ id: loadingId }));
  }
}

function* getMissingProjects() {
  const token: string = yield select(selectToken);
  const url: string = yield select(selectUrl);
  const loadingId = '[GitLab] getMissingProjects';

  // Check for MRs where there's no project loaded for
  const allMrs: GitLabMR[] = yield select(selectAllMrs);
  const userAssignedMrs: GitLabMR[] = yield select(selectMrsUserAssigned);
  const projects: GitLabProject[] = yield select(selectProjects);
  const unloadedProjectIds = allMrs
    .concat(userAssignedMrs)
    .filter(mr => !projects.find(project => project.id === mr.project_id))
    .map(mr => mr.project_id);

  if (!unloadedProjectIds || unloadedProjectIds.length <= 0) return;

  try {
    yield put(globalActions.addLoader({ id: loadingId }));
    const newProjects: GitLabProject[] = [];
    for (let projectId of unloadedProjectIds) {
      if (!projectId) continue;
      const project: GitLabProject = yield call(
        API.getProject,
        url,
        token,
        projectId,
      );
      newProjects.push(project);
    }
    yield put(
      gitLabActions.setProjects({
        items: newProjects,
        assoicatedId: '[No Listened Group]',
      }),
    );
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        globalActions.addErrorNotification(`[GitLab] ${error.message}`),
      );
    } else {
      yield put(globalActions.addErrorNotification(`[GitLab] Unknown Error`));
    }
  } finally {
    yield put(globalActions.removeLoader({ id: loadingId }));
  }
}

function* getMergeRequests() {
  const token: string = yield select(selectToken);
  const url: string = yield select(selectUrl);
  const listenedGroups: string[] = yield select(selectListenedGroups);
  let groups: GitLabGroup[] = yield select(selectGroups);

  if (listenedGroups.length <= 0 || groups.length <= 0) return;

  const loadingId = '[GitLab] getMergeRequests';
  yield put(globalActions.addLoader({ id: loadingId }));

  // Get all MRs for listened groups
  for (let groupName of listenedGroups) {
    try {
      const group = groups.find(g => g.full_name === groupName);
      if (!group) continue;
      const groupsMrs = yield call(
        API.getGroupMergeRequests,
        url,
        token,
        group.id,
      );
      yield put(actions.setMrs({ groupName: group.full_name, mrs: groupsMrs }));
    } catch (error) {
      if (error instanceof Error) {
        yield put(
          globalActions.addErrorNotification(`[GitLab] ${error.message}`),
        );
      } else {
        yield put(globalActions.addErrorNotification(`[GitLab] Unknown Error`));
      }
    }
  }
  yield put(globalActions.removeLoader({ id: loadingId }));
}

function* rerunPipeline(
  url: string,
  token: string,
  projectId: number,
  ref: string,
  groupName: string,
) {
  const loadingId = `[GitLab] rerunPipelines ${projectId} ${ref}`;
  yield put(globalActions.addLoader({ id: loadingId }));
  // immediately remove pipeline from list as to not start them several times
  yield put(actions.removePipelineToReload({ groupName, projectId, ref }));

  try {
    // check that ref is a MR ref
    if (ref.match(/refs\/merge-requests\/\d+\/head/) != null) {
      // extract MrIid from ref
      const match = ref.match(/[\d]+/);
      const mrIid = match ? match[0] : '';
      const newPipelineData: GitLabPipeline = yield call(
        API.rerunPipeline,
        url,
        token,
        projectId,
        mrIid,
      );
      yield put(
        actions.updatePipeline({
          pipeline: newPipelineData,
        }),
      );
    } else {
      const newPipelineData = yield call(
        API.createPipelineForRef,
        url,
        token,
        projectId,
        ref,
      );
      yield put(actions.updatePipeline({ pipeline: newPipelineData }));
    }
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        globalActions.addErrorNotification(`[GitLab] ${error.message}`),
      );
    } else {
      yield put(globalActions.addErrorNotification(`[GitLab] Unkown Error`));
    }
  } finally {
    yield put(actions.removePipelineToReload({ groupName, projectId, ref }));
    yield put(globalActions.removeLoader({ id: loadingId }));
  }
}

function* rerunPipelines() {
  const token: string = yield select(selectToken);
  const url: string = yield select(selectUrl);
  const pipelines: { groupName: string; ref: string; projectId: number }[] =
    yield select(selectPipelinesToReload);

  for (let pipeline of pipelines) {
    yield fork(
      rerunPipeline,
      url,
      token,
      pipeline.projectId,
      pipeline.ref,
      pipeline.groupName,
    );
  }
}

function* playJobs() {
  const token: string = yield select(selectToken);
  const url: string = yield select(selectUrl);
  const jobsToPlay: {
    groupName: string;
    projectId: number;
    mrIid: number;
    jobId: number;
  }[] = yield select(selectJobsToPlay);

  for (let job of jobsToPlay) {
    yield fork(
      playJob,
      url,
      token,
      job.projectId,
      job.jobId,
      job.mrIid,
      job.groupName,
    );
  }
}

function* playJob(
  url: string,
  token: string,
  projectId: number,
  jobId: number,
  mrIid: number,
  groupName: string,
) {
  const loadingId = `[GitLab] playJob ${projectId} ${jobId}`;
  yield put(globalActions.addLoader({ id: loadingId }));
  // immediately remove pipeline from list as to not start them several times
  yield put(actions.removeJobToPlay({ projectId, jobId, mrIid, groupName }));

  try {
    // play job
    yield call(API.playJob, url, token, projectId, jobId);
    // reload this Pipeline
    const pipelineData = yield call(
      API.loadPipelineForMr,
      url,
      token,
      projectId,
      mrIid,
    );
    yield put(actions.updatePipeline({ pipeline: pipelineData }));
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        globalActions.addErrorNotification(`[GitLab] ${error.message}`),
      );
    } else {
      yield put(globalActions.addErrorNotification(`[GitLab] Unkown Error`));
    }
  } finally {
    yield put(actions.removeJobToPlay({ projectId, jobId, mrIid, groupName })); // just to be sure
    yield put(globalActions.removeLoader({ id: loadingId }));
  }
}

function* loadEventsForProject(projectId: number, url: string, token: string) {
  const loadingId = `[GitLab] getEvents ${projectId}`;
  yield put(globalActions.addLoader({ id: loadingId }));
  try {
    const after = moment().subtract(1, 'day').format('YYYY-MM-DD');
    const events: GitLabEvent[] = yield call(
      API.getEvents,
      url,
      token,
      projectId,
      after,
    );
    yield put(
      gitLabActions.setEvents({ assoicatedId: projectId, items: events }),
    );
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        globalActions.addErrorNotification(`[GitLab] ${error.message}`),
      );
    } else {
      yield put(globalActions.addErrorNotification(`[GitLab] Unkown Error`));
    }
  } finally {
    yield put(globalActions.removeLoader({ id: loadingId }));
  }
}

function* getEvents() {
  const token: string = yield select(selectToken);
  const url: string = yield select(selectUrl);
  const projectsByGroup: Map<string, ProjectId[]> = yield select(
    selectProjectsByGroup,
  );
  const listenedGroups: string[] = yield select(selectListenedGroups);

  if (listenedGroups.length <= 0) return;

  for (let groupName of listenedGroups) {
    if (!groupName) continue;
    const projectIds = projectsByGroup.get(groupName);
    if (!projectIds) continue;
    for (let projectId of projectIds) {
      if (!projectId) continue;
      yield fork(loadEventsForProject, projectId, url, token);
    }
  }
}

/*
 * Helper functions to manage correct ordering of data loading
 */

function* testConnection() {
  const configured: boolean = yield select(selectConfigured);
  if (!configured) return;

  const loadingId = '[GitLab] testConnection';
  yield put(globalActions.addLoader({ id: loadingId }));

  const token: string = yield select(selectToken);
  const url: string = yield select(selectUrl);

  // Get user data
  try {
    const userInfo: GitLabUserData = yield call(API.getUserInfo, url, token);
    yield put(actions.setUserId(userInfo.id));
    yield put(actions.setUserData(userInfo));
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        globalActions.addErrorNotification(`[GitLab] ${error.message}`),
      );
    } else {
      yield put(globalActions.addErrorNotification(`[GitLab] Unknown Error`));
    }
    yield put(gitLabActions.setConfigured(false));
    return;
  } finally {
    yield put(globalActions.removeLoader({ id: loadingId }));
  }
  yield put(globalActions.addNotification('[GitLab] sucessfully connected'));
  yield call(persist);
  yield call(loadAll);
}

function* pollLong() {
  while (true) {
    const configured: boolean = yield select(selectConfigured);
    yield delay(1000 * 60 * 60); // every 60 Minutes
    if (configured) {
      yield fork(getUserInfo);
      yield call(getGroups);
      yield call(getProjects);
      yield call(persist);
    }
  }
}

function* pollShort() {
  while (true) {
    const configured: boolean = yield select(selectConfigured);
    yield delay(1000 * 60); // every minute
    if (configured) {
      yield all([
        call(getUserAssignedMrs),
        call(getMergeRequests),
        call(getEvents),
      ]);

      yield call(getPipelines);
      yield call(getMissingProjects);
      yield call(persist);
    }
  }
}

function* loadAll() {
  const configured: boolean = yield select(selectConfigured);
  if (!configured) return;
  // Calls without any dependency
  yield fork(getUserInfo);
  yield fork(getUserAssignedMrs);

  yield call(getGroups); // All other calls depend on groups, block for this call

  yield all([call(getProjects), call(getMergeRequests)]);

  yield all([call(getEvents), call(getPipelines)]);

  yield call(getMissingProjects);

  yield call(persist);
}

function* persist() {
  const state = yield select(selectGitLab);
  yield call(PersistanceAPI.saveToLocalStorage, LOCALSTORAGE_KEY, state);
}

function* clear() {
  yield call(PersistanceAPI.clearLocalStorage, LOCALSTORAGE_KEY);
}

export function* gitLabSaga() {
  yield takeLeading(actions.setConfigured.type, testConnection);
  yield takeLeading(actions.addListenedGroup.type, loadAll);
  yield takeEvery(actions.removeListenedGroup.type, persist);
  yield takeLeading(actions.reload.type, loadAll);
  yield takeLeading(actions.deleteConfiguration.type, clear);
  yield takeEvery(actions.reloadPipeline.type, rerunPipelines);
  yield takeEvery(actions.playJob.type, playJobs);
  yield spawn(pollLong);
  yield spawn(pollShort);
}
