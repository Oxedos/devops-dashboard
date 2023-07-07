import { createSelector } from 'reselect';
import { createParameterSelector, selectGitlabSlice } from './selectors';
import { selectConfiguredVisualisations } from 'app/data/globalSlice/selectors';
import { VisualisationType } from 'app/data/VisualisationTypes';
import { selectProjects } from './projectSelectors';

export const selectIssues = createSelector(
  selectGitlabSlice,
  slice => slice.issues,
);

export const selectProjectIdsListeningForIssues = createSelector(
  selectConfiguredVisualisations,
  selectProjects,
  (configuredVisualisations, projects) =>
    configuredVisualisations
      .filter(vis => vis && vis.type === VisualisationType.GITLAB_ISSUES)
      .map(vis => vis.props?.projectName)
      .filter(projectName => !!projectName)
      .map(projectName =>
        projects.find(p => p.name_with_namespace === projectName),
      )
      .map(project => project?.id)
      .filter(project => !!project),
);

export const selectIssuesByProjectId = createSelector(
  selectIssues,
  createParameterSelector(p => p.projectId),
  (issues, projectId) => {
    if (!issues) return [];
    if (!projectId) return [];
    return issues.filter(issue => issue.project_id === projectId);
  },
);
