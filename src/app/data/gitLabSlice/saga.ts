import * as API from 'app/apis/gitlab';
import {
  GitLabEvent,
  GitLabGroup,
  GitLabMR,
  GitLabPipeline,
  GitLabProject,
  GitLabUserData,
  GroupName,
} from 'app/apis/gitlab/types';
import * as PersistanceAPI from 'app/apis/persistance';
import { globalActions } from 'app/data/globalSlice';
import moment from 'moment';
import * as Effects from 'redux-saga/effects';
import {
  all,
  fork,
  join,
  spawn,
  takeEvery,
  takeLeading,
} from 'redux-saga/effects';
import { SW_MESSAGE_TYPES } from 'service-worker';
import { LOCALSTORAGE_KEY, gitLabActions as actions, gitLabActions } from '.';
import {
  selectGroupByGroupName,
  selectGroupNamesListeningForEvents,
  selectGroupsListeningForMrs,
  selectGroupsListeningForPipelines,
  selectListenedGroups,
} from './groupSelectors';
import { selectAllMrs, selectMrsByGroup } from './mrSelectors';
import {
  getSelectedPipelineStatus,
  selectPipelinesToReload,
} from './pipelineSelectors';
import {
  selectProjects,
  selectProjectsByGroup,
  selectProjectsByGroupSortedByLatestActivity,
} from './projectSelectors';
import {
  selectConfigured,
  selectGitlabSlice,
  selectJobsToPlay,
  selectUrl,
} from './selectors';
import { GitLabState } from './types';

const { select, call, put, delay } = Effects;

/*
 * Pure Data Loaders
 */

function* getUserInfo() {
  const url: string = yield select(selectUrl);
  const loadingId = '[GitLab] getUserInfo';
  yield put(globalActions.addLoader({ id: loadingId }));

  // Get user data
  try {
    const userInfo: GitLabUserData = yield call(API.getUserInfo, url);
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
  const url: string = yield select(selectUrl);
  const loadingId = '[GitLab] getGroups';
  yield put(globalActions.addLoader({ id: loadingId }));

  // Get Groups
  try {
    const groups: GitLabGroup[] = yield call(API.getGroups, url);
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

function* loadProjectsForGroup(groupName: string, url: string) {
  const group = yield select(state =>
    selectGroupByGroupName(state, { groupName }),
  );
  if (!group) return;
  try {
    const projects: GitLabProject[] = yield call(
      API.getProjectsForGroup,
      url,
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
  const url: string = yield select(selectUrl);
  const listenedGroups: string[] = yield select(selectListenedGroups);

  if (listenedGroups.length <= 0) return;

  const loadingId = '[GitLab] getProjects';
  yield put(globalActions.addLoader({ id: loadingId }));

  const tasks: any[] = [];
  for (let groupName of listenedGroups) {
    const task = yield fork(loadProjectsForGroup, groupName, url);
    tasks.push(task);
  }
  yield join(tasks); // wait for all tasks to finish
  yield put(globalActions.removeLoader({ id: loadingId }));
}

function* loadPipelinesForProject(
  project: GitLabProject,
  mrs: GitLabMR[],
  includeBranches: boolean,
  includeMrs: boolean,
  selectedStatus: string[],
  url: string,
) {
  try {
    const pipelines: GitLabPipeline[] = yield call(
      API.getPipelines,
      url,
      project.id,
      mrs,
      includeBranches,
      includeMrs,
      selectedStatus,
    );
    return pipelines;
  } catch (error) {
    return [];
  }
}

function* loadPipelinesForGroup(
  groupName: GroupName,
  includeBranches: boolean,
  includeMrs: boolean,
  selectedStatus: string[],
  url: string,
) {
  const groupProjects: GitLabProject[] = yield select(state =>
    selectProjectsByGroup(state, { groupName }),
  );
  const groupMrs: GitLabMR[] = yield select(state =>
    selectMrsByGroup(state, { groupName }),
  );

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
      includeBranches,
      includeMrs,
      selectedStatus,
      url,
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
  const groupsListeningForPipelines: {
    group: string;
    includeBranches: boolean;
    includeMrs: boolean;
    includeFailed: boolean;
    includeSuccess: boolean;
    includeCanceled: boolean;
    includeRunning: boolean;
    includeCreated: boolean;
    includeManual: boolean;
  }[] = yield select(selectGroupsListeningForPipelines);
  if (groupsListeningForPipelines.length <= 0) return;

  const url: string = yield select(selectUrl);

  for (let groupConfig of groupsListeningForPipelines) {
    if (!groupConfig || !groupConfig.group) continue;
    const selectedStatus = getSelectedPipelineStatus(
      groupConfig.includeCanceled,
      groupConfig.includeCreated,
      groupConfig.includeFailed,
      groupConfig.includeRunning,
      groupConfig.includeSuccess,
      groupConfig.includeManual,
    );
    yield fork(
      loadPipelinesForGroup,
      groupConfig.group,
      groupConfig.includeBranches,
      groupConfig.includeMrs,
      selectedStatus,
      url,
    );
  }
}

function* getUserAssignedMrs() {
  const url: string = yield select(selectUrl);
  const loadingId = '[GitLab] getUserAssignedMRs';
  yield put(globalActions.addLoader({ id: loadingId }));

  try {
    const mrsUserAssigned = yield call(API.getUserAssignedMrs, url);
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
  const url: string = yield select(selectUrl);
  const loadingId = '[GitLab] getMissingProjects';

  // Check for MRs where there's no project loaded for
  const mrs = yield select(selectAllMrs);
  const projects: GitLabProject[] = yield select(selectProjects);
  const unloadedProjectIds = mrs
    .filter(mr => !projects.find(project => project.id === mr.project_id))
    .map(mr => mr.project_id);

  if (!unloadedProjectIds || unloadedProjectIds.length <= 0) return;

  try {
    yield put(globalActions.addLoader({ id: loadingId }));
    const newProjects: GitLabProject[] = [];
    for (let projectId of unloadedProjectIds) {
      if (!projectId) continue;
      const project: GitLabProject = yield call(API.getProject, url, projectId);
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
  const url: string = yield select(selectUrl);
  const groupConfigsListeningForMrs: {
    group: GitLabGroup;
    includeWIP: boolean;
  }[] = yield select(selectGroupsListeningForMrs);

  if (!groupConfigsListeningForMrs || groupConfigsListeningForMrs.length <= 0)
    return;

  const loadingId = '[GitLab] getMergeRequests';
  yield put(globalActions.addLoader({ id: loadingId }));

  // Get all MRs for listened groups
  for (let groupConfig of groupConfigsListeningForMrs) {
    if (!groupConfig || !groupConfig.group) continue;
    try {
      const groupsMrs = yield call(
        API.getGroupMergeRequests,
        url,
        groupConfig.group.id,
      );
      yield put(
        actions.setMrs({
          groupName: groupConfig.group.full_name,
          mrs: groupsMrs,
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
  const url: string = yield select(selectUrl);
  const pipelines: { groupName: string; ref: string; projectId: number }[] =
    yield select(selectPipelinesToReload);

  for (let pipeline of pipelines) {
    yield fork(
      rerunPipeline,
      url,
      pipeline.projectId,
      pipeline.ref,
      pipeline.groupName,
    );
  }
}

function* playJobs() {
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
      job.projectId,
      job.jobId,
      job.mrIid,
      job.groupName,
    );
  }
}

function* playJob(
  url: string,
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
    yield call(API.playJob, url, projectId, jobId);
    // reload this Pipeline
    const pipelineData = yield call(
      API.loadPipelineForMr,
      url,
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

function* loadEventsForProject(projectId: number, url: string) {
  const loadingId = `[GitLab] getEvents ${projectId}`;
  yield put(globalActions.addLoader({ id: loadingId }));
  let events: GitLabEvent[] = [];
  try {
    const after = moment().subtract(1, 'day').format('YYYY-MM-DD');
    events = yield call(API.getEvents, url, projectId, after);
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
    return events;
  }
}

function* getEvents() {
  const url: string = yield select(selectUrl);
  // load groups listening for events
  const listenedGroups: string[] = yield select(
    selectGroupNamesListeningForEvents,
  );
  if (!listenedGroups || listenedGroups.length <= 0) return;
  for (let groupName of listenedGroups) {
    const listenedProjects: GitLabProject[] = yield select(
      selectProjectsByGroupSortedByLatestActivity,
      { groupName },
    );
    let eventCount = 0;
    let i = 0;
    // TODO: Make this magic number user configurable
    while (eventCount < 20 && i < listenedProjects.length) {
      const project = listenedProjects[i];
      if (!project) continue;
      const events: GitLabEvent[] = yield call(
        loadEventsForProject,
        project.id,
        url,
      );
      eventCount += events.length;
      yield put(
        gitLabActions.setEvents({ assoicatedId: project.id, items: events }),
      );
    }
  }
}

/*
 * Helper functions to manage correct ordering of data loading
 */

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
  const isAuthenticated = yield call(tryLoadingUserinfo);

  if (!isAuthenticated) {
    signalServiceWorker();
    return;
  }

  yield fork(getUserAssignedMrs);

  yield call(getGroups); // All other calls depend on groups, block for this call

  yield all([call(getProjects), call(getMergeRequests)]);

  yield all([call(getEvents), call(getPipelines)]);

  yield call(getMissingProjects);

  yield call(persist);
}

function* persist() {
  const state = yield select(selectGitlabSlice);
  const stateCopy: GitLabState = { ...state };
  // state can become quite large...
  stateCopy.events = [];
  yield call(PersistanceAPI.saveToLocalStorage, LOCALSTORAGE_KEY, stateCopy);
}

function* clear() {
  yield call(PersistanceAPI.clearLocalStorage, LOCALSTORAGE_KEY);
}

function* tryLoadingUserinfo() {
  const url = yield select(selectUrl);
  try {
    const userInfo = yield call(API.getUserInfo, url);
    yield put(actions.setUserData(userInfo));
    return true;
  } catch (error) {
    return false;
  }
}

const signalServiceWorker = () => {
  if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
    return;
  }
  navigator.serviceWorker.controller.postMessage({
    type: SW_MESSAGE_TYPES.CHECK_AUTHENTICATED,
  });
};

export function* gitLabSaga() {
  yield takeLeading(actions.addGitlabVisualisation.type, loadAll);
  yield takeEvery(actions.cleanState.type, persist);
  yield takeLeading(actions.reload.type, loadAll);
  yield takeLeading(actions.deleteConfiguration.type, clear);
  yield takeEvery(actions.reloadPipeline.type, rerunPipelines);
  yield takeEvery(actions.playJob.type, playJobs);
  yield takeLeading(actions.setUrl.type, persist);
  yield takeLeading(actions.setApplicationId.type, persist);
  yield spawn(pollLong);
  yield spawn(pollShort);
}
