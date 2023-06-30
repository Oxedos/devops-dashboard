import {
  GitLabMR,
  GitLabPipeline,
  GitLabProject,
  GroupName,
} from 'app/apis/gitlab/types';
import { globalActions } from 'app/data/globalSlice';
import { call, fork, join, put, select } from 'redux-saga/effects';
import { selectJobsToPlay, selectUrl } from '../selectors/selectors';
import { selectGroupsListeningForPipelines } from '../selectors/groupSelectors';
import {
  getSelectedPipelineStatus,
  selectPipelinesToReload,
} from '../selectors/pipelineSelectors';
import { selectProjectsByGroup } from '../selectors/projectSelectors';
import { selectMrsByGroup } from '../selectors/mrSelectors';
import { gitLabActions } from '..';
import moment from 'moment';
import {
  createPipelineForRef,
  getPipelines,
  rerunPipeline as rerunPipelineApi,
  playJob as playJobApi,
  loadPipelineForMr,
} from 'app/apis/gitlab';
import { gitLabActions as actions } from '..';

export function* loadPipelines() {
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
      getPipelinesForProject,
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

function* getPipelinesForProject(
  project: GitLabProject,
  mrs: GitLabMR[],
  includeBranches: boolean,
  includeMrs: boolean,
  selectedStatus: string[],
  url: string,
) {
  try {
    if (!project) return [];
    // TODO: Maybe make this magic number configurable as well?
    if (
      moment(project.last_activity_at).isBefore(moment().subtract(3, 'days'))
    ) {
      return [];
    }
    const pipelines: GitLabPipeline[] = yield call(
      getPipelines,
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

export function* rerunPipelines() {
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
        rerunPipelineApi,
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
        createPipelineForRef,
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

export function* playJobs() {
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
    yield call(playJobApi, url, projectId, jobId);
    // reload this Pipeline
    // TODO: Do I have to load everything in API.loadPipelineForMr?
    const pipelineData = yield call(loadPipelineForMr, url, projectId, mrIid);
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
