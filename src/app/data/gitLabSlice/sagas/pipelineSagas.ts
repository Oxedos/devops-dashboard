import {
  createPipelineForRef,
  getPipelines,
  loadPipelineForMr,
  playJob as playJobApi,
  rerunPipeline as rerunPipelineApi,
} from 'app/apis/gitlab';
import {
  GitLabMR,
  GitLabPipeline,
  GitLabProject,
  GroupName,
} from 'app/apis/gitlab/types';
import moment from 'moment';
import { call, fork, join, put, select } from 'redux-saga/effects';
import { gitLabActions as actions, gitLabActions } from '..';
import { selectGroupsListeningForPipelines } from '../selectors/groupSelectors';
import { selectMrsByGroup } from '../selectors/mrSelectors';
import {
  getSelectedPipelineStatus,
  selectPipelinesToReload,
} from '../selectors/pipelineSelectors';
import { selectProjectsByGroup } from '../selectors/projectSelectors';
import { selectJobsToPlay, selectUrl } from '../selectors/selectors';
import { displayNotification, removeLoader, setLoader } from './sagaHelper';

export function* loadPipelines() {
  const loaderId = yield call(setLoader, 'Pipelines');
  yield call(loadGroupPipelines);
  yield call(removeLoader, loaderId);
}

function* loadGroupPipelines() {
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

  yield put(
    gitLabActions.setPipelines({
      items: taskResults.flat().filter(pipelines => !!pipelines),
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
    yield call(displayNotification, error);
    return undefined;
  }
}

export function* rerunPipelines() {
  const url: string = yield select(selectUrl);
  const pipelines: { groupName: string; ref: string; projectId: number }[] =
    yield select(selectPipelinesToReload);

  const loaderId = yield call(setLoader, 'Rerun Pipelines');

  for (let pipeline of pipelines) {
    yield call(
      rerunPipeline,
      url,
      pipeline.projectId,
      pipeline.ref,
      pipeline.groupName,
    );
  }

  yield call(removeLoader, loaderId);
}

function* rerunPipeline(
  url: string,
  projectId: number,
  ref: string,
  groupName: string,
) {
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
    yield call(displayNotification, error);
  } finally {
    yield put(actions.removePipelineToReload({ groupName, projectId, ref }));
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
  const loaderId = yield call(setLoader, 'Play Jobs');
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
  yield call(removeLoader, loaderId);
}

function* playJob(
  url: string,
  projectId: number,
  jobId: number,
  mrIid: number,
  groupName: string,
) {
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
    yield call(displayNotification, error);
  } finally {
    yield put(actions.removeJobToPlay({ projectId, jobId, mrIid, groupName })); // just to be sure
  }
}
