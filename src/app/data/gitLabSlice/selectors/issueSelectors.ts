import { VisualisationType } from 'app/data/VisualisationTypes';
import { selectConfiguredVisualisations } from 'app/data/globalSlice/selectors';
import { createSelector } from 'reselect';
import { selectProjects } from './projectSelectors';
import { createParameterSelector, selectGitlabSlice } from './selectors';

export const selectIssues = createSelector(
  selectGitlabSlice,
  slice => slice.issues,
);

export const selectProjectsListeningForIssues = createSelector(
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
