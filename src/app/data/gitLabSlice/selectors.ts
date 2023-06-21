import { createSelector } from '@reduxjs/toolkit';

import { RootState } from 'types';
import { initialState, uniqueGroupListeners } from '.';
import { GitLabPipeline } from 'app/apis/gitlab/types';
import moment from 'moment';

const selectSlice = (state: RootState) => state.gitLab || initialState;

export const selectGitLab = createSelector([selectSlice], state => state);
export const selectConfigured = createSelector(
  selectGitLab,
  state => state.configured,
);
export const selectUrl = createSelector(selectGitLab, state => state.url);
export const selectToken = createSelector(selectGitLab, state => state.token);
export const selectUserId = createSelector(selectGitLab, state => state.userId);
export const selectUserData = createSelector(
  selectGitLab,
  state => state.userData,
);
export const selectGroups = createSelector(selectGitLab, state => state.groups);
export const selectMrsByGroup = createSelector(
  selectGitLab,
  state => state.mrsByGroup,
);
export const selectAllMrs = createSelector(selectGitLab, state => state.mrs);
export const selectMrsUserAssigned = createSelector(
  selectGitLab,
  state => state.mrsUserAssigned,
);
export const selectProjects = createSelector(
  selectGitLab,
  state => state.projects,
);
export const selectListenedGroups = createSelector(selectGitLab, state =>
  uniqueGroupListeners(state),
);
export const selectProjectsByGroup = createSelector(
  selectGitLab,
  state => state.projectsByGroup,
);
export const selectPipelines = createSelector(
  selectGitLab,
  state => state.pipelines,
);
export const selectPipelinesByGroup = createSelector(
  selectGitLab,
  state => state.pipelinesByGroup,
);
export const selectPipelinesToReload = createSelector(
  selectGitLab,
  state => state.pipelinesToReload,
);
export const selectJobsToPlay = createSelector(
  selectGitLab,
  state => state.jobsToPlay,
);
export const selectEvents = createSelector(selectGitLab, state => state.events);
export const selectEventsByProject = createSelector(
  selectGitLab,
  state => state.eventsByProject,
);

function getSelectedPipelineStatus(
  pipelines_canceled,
  pipelines_created,
  pipelines_failed,
  pipelines_running,
  pipelines_success,
  pipelines_manual,
) {
  const status: string[] = [];
  if (pipelines_canceled) status.push('canceled');
  if (pipelines_created) status.push('created');
  if (pipelines_failed) status.push('failed');
  if (pipelines_running) status.push('running');
  if (pipelines_success) status.push('success');
  if (pipelines_manual) status.push('manual');
  return status;
}

function sortPipelinesByDate(arg1: GitLabPipeline, arg2: GitLabPipeline) {
  return moment(arg2.created_at).diff(moment(arg1.created_at));
}

function createParameterSelector(selector) {
  return (_, params) => selector(params);
}

export const selectPipelinesFiltered = createSelector(
  [
    selectPipelines,
    selectPipelinesByGroup,
    selectAllMrs,
    createParameterSelector(p => p.groupName),
    createParameterSelector(p => p.includeBranchPipelines),
    createParameterSelector(p => p.includeMrPipelines),
    createParameterSelector(p => p.includeCancelled),
    createParameterSelector(p => p.includeCreated),
    createParameterSelector(p => p.includeFailed),
    createParameterSelector(p => p.includeRunning),
    createParameterSelector(p => p.includeSuccess),
    createParameterSelector(p => p.includeManual),
  ],
  (
    pipelines,
    pipelinesByGroup,
    mrs,
    groupName,
    includeBranchPipelines,
    includeMrPipelines,
    includeCancelled,
    includeCreated,
    includeFailed,
    includeRunning,
    includeSuccess,
    includeManual,
  ) => {
    if (!groupName) return [];
    // Get all pipelineIds for the selected group
    const pipelineIds = pipelinesByGroup.get(groupName);
    if (!pipelineIds || pipelineIds.length <= 0) return [];
    // find the proper pipelines in the state
    const pipelinesInGroup = pipelines.filter(pipeline =>
      pipelineIds.includes(pipeline.id),
    );
    // Figure out which status the user wants to see
    const selectedStatus = getSelectedPipelineStatus(
      includeCancelled,
      includeCreated,
      includeFailed,
      includeRunning,
      includeSuccess,
      includeManual,
    );
    if (selectedStatus.length <= 0) return [];
    // filter pipelines by status and sort by date
    let sortedPipelines = pipelinesInGroup
      .slice()
      .sort(sortPipelinesByDate)
      .filter(p => selectedStatus.includes(p.status));
    // omit pipelines sources the user does not want to see
    if (includeMrPipelines && !includeBranchPipelines) {
      sortedPipelines = sortedPipelines.filter(p =>
        p.ref.startsWith('refs/merge-requests'),
      );
    } else if (!includeMrPipelines && includeBranchPipelines) {
      sortedPipelines = sortedPipelines.filter(
        p => !p.ref.startsWith('refs/merge-requests'),
      );
    }

    sortedPipelines = sortedPipelines.map(pipeline => {
      if (!pipeline.ref.startsWith('refs/merge-requests')) return pipeline;
      const associatedMr = mrs.find(
        mr =>
          mr.project_id === pipeline.project_id &&
          pipeline.ref.includes(`${mr.iid}`),
      );
      if (!associatedMr) return pipeline;
      return { ...pipeline, labels: associatedMr.labels, associatedMr };
    });
    return sortedPipelines;
  },
);
