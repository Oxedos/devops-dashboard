import * as Effects from 'redux-saga/effects';
import { gitLabActions as actions, gitLabActions, LOCALSTORAGE_KEY } from '.';
import { globalActions } from 'app/data/globalSlice';
import * as API from 'app/apis/gitlab';
import * as GitLabTypes from 'app/apis/gitlab/types';
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
} from './selectors';
import { all, fork, join, spawn, takeEvery } from 'redux-saga/effects';
import moment from 'moment';

const { select, call, put, delay } = Effects;
const takeLatest: any = Effects.takeLatest;

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
    const userInfo: GitLabTypes.GitLabUserData = yield call(
      API.getUserInfo,
      url,
      token,
    );
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
    const groups: GitLabTypes.GitLabGroup[] = yield call(
      API.getGroups,
      url,
      token,
    );
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
  groups: GitLabTypes.GitLabGroup[],
  groupName: string,
  url: string,
  token: string,
) {
  const group = groups.find(group => group.full_name === groupName);
  if (!group) return;
  try {
    const projects: GitLabTypes.GitLabProject[] = yield call(
      API.getProjectsForGroup,
      url,
      token,
      group.id,
      {
        include_subgroups: true,
        with_shared: false,
      },
    );
    yield put(actions.setProjects({ groupName, projects }));
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
  let groups: GitLabTypes.GitLabGroup[] = yield select(selectGroups);

  if (listenedGroups.length <= 0) return;
  if (groups.length <= 0) {
    yield call(getGroups);
    groups = yield select(selectGroups);
  }

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
  project: GitLabTypes.GitLabProject,
  url: string,
  token: string,
) {
  try {
    const pipelines: GitLabTypes.GitLabPipeline[] = yield call(
      API.getPipelines,
      url,
      token,
      project.id,
      {
        updated_after: moment().subtract(2, 'weeks').toISOString(),
      },
    );
    return pipelines;
  } catch (error) {
    return [];
  }
}

function* loadPipelinesForGroup(
  projectsByGroup: Map<string, GitLabTypes.GitLabProject[]>,
  groupName: string,
  url: string,
  token: string,
) {
  const projects = projectsByGroup.get(groupName);
  if (!projects || projects.length <= 0) return [];

  const loadingId = `[GitLab] getPipelines ${groupName}`;
  yield put(globalActions.addLoader({ id: loadingId }));

  let tasks: any[] = [];
  // Parallelise all calls for each project in this group
  for (let project of projects) {
    const task = yield fork(loadPipelinesForProject, project, url, token);
    tasks.push(task);
  }
  const taskResults: any[] = yield join(tasks);

  yield put(globalActions.removeLoader({ id: loadingId }));
  yield put(
    gitLabActions.setPipelines({
      groupName,
      pipelines: taskResults.flat(),
    }),
  );
}

function* getPipelines() {
  const token: string = yield select(selectToken);
  const url: string = yield select(selectUrl);
  let projectsByGroup: Map<string, GitLabTypes.GitLabProject[]> = yield select(
    selectProjectsByGroup,
  );
  const listenedGroups: string[] = yield select(selectListenedGroups);

  if (listenedGroups.length <= 0) return;

  for (let groupName of listenedGroups) {
    yield fork(loadPipelinesForGroup, projectsByGroup, groupName, url, token);
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
    yield put(actions.setMrsUserAssigned(mrsUserAssigned));
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
  yield put(globalActions.addLoader({ id: loadingId }));

  // Check for MRs where there's no project loaded for
  const allMrs: GitLabTypes.GitLabMR[] = yield select(selectAllMrs);
  const userAssignedMrs: GitLabTypes.GitLabMR[] = yield select(
    selectMrsUserAssigned,
  );
  const projects: GitLabTypes.GitLabProject[] = yield select(selectProjects);
  const unloadedProjectIds = allMrs
    .concat(userAssignedMrs)
    .filter(mr => !projects.find(project => project.id === mr.project_id))
    .map(mr => mr.project_id);
  const newProjects: GitLabTypes.GitLabProject[] = [];
  for (let projectId of unloadedProjectIds) {
    const project: GitLabTypes.GitLabProject = yield call(
      API.getProject,
      url,
      token,
      projectId,
    );
    newProjects.push(project);
  }
  yield put(
    gitLabActions.setProjects({
      groupName: '[No Listened Group]',
      projects: newProjects,
    }),
  );
  yield put(globalActions.removeLoader({ id: loadingId }));
}

function* getMergeRequests() {
  const token: string = yield select(selectToken);
  const url: string = yield select(selectUrl);
  const listenedGroups: string[] = yield select(selectListenedGroups);
  let groups: GitLabTypes.GitLabGroup[] = yield select(selectGroups);

  if (listenedGroups.length <= 0) return;

  const loadingId = '[GitLab] getMergeRequests';
  yield put(globalActions.addLoader({ id: loadingId }));

  if (groups.length <= 0) {
    yield call(getGroups);
    groups = yield select(selectGroups);
  }

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

function* getAllIssueStatistics() {
  const token: string = yield select(selectToken);
  const url: string = yield select(selectUrl);
  const loadingId = '[GitLab] getAllIssueStatistics';
  yield put(globalActions.addLoader({ id: loadingId }));

  try {
    const statisticsAll = yield call(API.getIssuesStatistics, url, token);
    yield put(actions.setIssuesStatisticForAll(statisticsAll));
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        globalActions.addErrorNotification(`[GitLab] ${error.message}`),
      );
    } else {
      yield put(globalActions.addErrorNotification(`[GitLab] Unknwown Error`));
    }
  } finally {
    yield put(globalActions.removeLoader({ id: loadingId }));
  }
}

function* getIssueStatistics() {
  const token: string = yield select(selectToken);
  const url: string = yield select(selectUrl);
  const listenedGroups: string[] = yield select(selectListenedGroups);
  let groups: GitLabTypes.GitLabGroup[] = yield select(selectGroups);

  if (listenedGroups.length <= 0) return;

  const loadingId = '[GitLab] getIssueStatistics';
  yield put(globalActions.addLoader({ id: loadingId }));

  if (groups.length <= 0) {
    yield call(getGroups);
    groups = yield select(selectGroups);
  }

  for (let groupName of listenedGroups) {
    const group = groups.find(group => group.full_name === groupName);
    if (!group) continue;
    try {
      const groupIssuesStatistics = yield call(
        API.getIssuesStatisticsForGroup,
        url,
        token,
        group.id,
      );
      yield put(
        actions.setIssuesStatisticForGroup({
          groupName: group.full_name,
          stats: groupIssuesStatistics,
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
      const newPipelineData = yield call(
        API.rerunPipeline,
        url,
        token,
        projectId,
        mrIid,
      );
      yield put(
        actions.updatePipeline({ groupName, pipeline: newPipelineData }),
      );
    } else {
      const newPipelineData = yield call(
        API.createPipelineForRef,
        url,
        token,
        projectId,
        ref,
      );
      yield put(
        actions.updatePipeline({ groupName, pipeline: newPipelineData }),
      );
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
    yield put(actions.updatePipeline({ groupName, pipeline: pipelineData }));
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
    const userInfo: GitLabTypes.GitLabUserData = yield call(
      API.getUserInfo,
      url,
      token,
    );
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

function* loadProjectsAndPipelines() {
  yield call(getProjects);
  yield call(getPipelines);
}

function* pollLong() {
  while (true) {
    const configured: boolean = yield select(selectConfigured);
    if (configured) {
      yield fork(getUserInfo);
      yield call(getGroups);
      yield call(getProjects);
      yield call(persist);
      yield delay(1000 * 60 * 15); // every 15 Minutes
    }
  }
}

function* loadAfterListenerAdd() {
  yield fork(getIssueStatistics);

  yield all([call(getMergeRequests), call(loadProjectsAndPipelines)]);
  yield call(getMissingProjects);

  yield call(persist);
}

function* pollShort() {
  while (true) {
    const configured: boolean = yield select(selectConfigured);
    if (configured) {
      yield fork(getUserAssignedMrs);
      yield fork(getIssueStatistics);
      yield fork(getAllIssueStatistics);

      yield all([call(getMergeRequests), call(getPipelines)]);

      yield call(getMissingProjects);
      yield call(persist);
      yield delay(1000 * 60); // every minute
    }
  }
}

function* loadAll() {
  const configured: boolean = yield select(selectConfigured);
  if (!configured) return;
  // Calls without any dependency
  yield fork(getUserInfo);
  yield fork(getUserAssignedMrs);
  yield fork(getAllIssueStatistics);

  yield call(getGroups); // All other calls depend on groups, block for this call

  yield fork(getIssueStatistics);
  yield all([call(getMergeRequests), call(loadProjectsAndPipelines)]);
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
  yield takeLatest(actions.setConfigured.type, testConnection);
  yield takeEvery(actions.addListenedGroup.type, loadAfterListenerAdd);
  yield takeEvery(actions.removeListenedGroup.type, persist);
  yield takeLatest(actions.reload.type, loadAll);
  yield takeLatest(actions.deleteConfiguration.type, clear);
  yield takeEvery(actions.reloadPipeline.type, rerunPipelines);
  yield takeEvery(actions.playJob.type, playJobs);
  yield spawn(pollLong);
  yield spawn(pollShort);
}
