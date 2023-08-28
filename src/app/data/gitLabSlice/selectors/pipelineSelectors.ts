import { createSelector } from '@reduxjs/toolkit';
import { GitLabPipeline } from 'app/apis/gitlab/types';
import moment from 'moment';
import { selectAllMrs } from './mrSelectors';
import { selectProjectsByGroup } from './projectSelectors';
import { createParameterSelector, selectGitlabSlice } from './selectors';

export const selectPipelines = createSelector(
  selectGitlabSlice,
  state => state.pipelines,
);

export const selectPipelinesToReload = createSelector(
  selectGitlabSlice,
  state => state.pipelinesToReload,
);

export const selectPipelinesByProject = createSelector(
  selectPipelines,
  createParameterSelector(p => p.projectId),
  (pipelines, projectId) => {
    if (!projectId) return [];
    return pipelines.filter(pipeline => pipeline.project_id === projectId);
  },
);

export const selectPipelineByProjectIdAndMrIid = createSelector(
  selectPipelinesByProject,
  createParameterSelector(p => p.mrIid),
  (pipelinesByProject, mrIid) => {
    if (!mrIid) return undefined;
    return pipelinesByProject.find(
      pipeline => pipeline.ref && pipeline.ref.includes(`${mrIid}`),
    );
  },
);

export const selectPipelinesByGroup = createSelector(
  selectPipelines,
  selectProjectsByGroup,
  (pipelines, projectsByGroup) => {
    if (!pipelines || pipelines.length <= 0) return [];
    if (!projectsByGroup || projectsByGroup.length <= 0) return [];
    const projectIds = projectsByGroup.map(project => project.id);
    return pipelines.filter(pipeline =>
      projectIds.includes(pipeline.project_id),
    );
  },
);

export const selectPipelinesFiltered = createSelector(
  [
    selectPipelinesByGroup,
    selectAllMrs,
    // createParameterSelector(p => p.groupName),
    createParameterSelector(p => p.includeBranchPipelines),
    createParameterSelector(p => p.includeMrPipelines),
    createParameterSelector(p => p.includeCancelled),
    createParameterSelector(p => p.includeCreated),
    createParameterSelector(p => p.includeFailed),
    createParameterSelector(p => p.includeRunning),
    createParameterSelector(p => p.includeSuccess),
    createParameterSelector(p => p.includeManual),
    createParameterSelector(p => p.includePending),
  ],
  (
    pipelinesInGroup,
    mrs,
    includeBranchPipelines,
    includeMrPipelines,
    includeCancelled,
    includeCreated,
    includeFailed,
    includeRunning,
    includeSuccess,
    includeManual,
    includePending,
  ) => {
    // Figure out which status the user wants to see
    const selectedStatus = getSelectedPipelineStatus(
      includeCancelled,
      includeCreated,
      includeFailed,
      includeRunning,
      includeSuccess,
      includeManual,
      includePending,
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
      const associatedMr =
        mrs &&
        mrs.find(
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

export function getSelectedPipelineStatus(
  pipelines_canceled,
  pipelines_created,
  pipelines_failed,
  pipelines_running,
  pipelines_success,
  pipelines_manual,
  pipelines_pending,
) {
  const status: string[] = [];
  if (pipelines_canceled) status.push('canceled');
  if (pipelines_created) status.push('created');
  if (pipelines_failed) status.push('failed');
  if (pipelines_running) status.push('running');
  if (pipelines_success) status.push('success');
  if (pipelines_manual) status.push('manual');
  if (pipelines_pending) status.push('pending');
  return status;
}

function sortPipelinesByDate(arg1: GitLabPipeline, arg2: GitLabPipeline) {
  return moment(arg2.created_at).diff(moment(arg1.created_at));
}
