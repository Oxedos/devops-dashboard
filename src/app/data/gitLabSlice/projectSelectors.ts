import { createSelector } from '@reduxjs/toolkit';
import { createParameterSelector, selectGitLab } from './selectors';

export const selectProjects = createSelector(
  selectGitLab,
  state => state.projects,
);

export const selectAllProjectIdsByGroup = createSelector(
  selectGitLab,
  state => state.projectsByGroup,
);

export const selectProjectByProjectId = createSelector(
  selectProjects,
  createParameterSelector(p => p.projectId),
  (projects, projectId) => {
    if (!projectId) return undefined;
    return projects.find(project => project.id === projectId);
  },
);

export const selectProjectIdsByGroup = createSelector(
  selectAllProjectIdsByGroup,
  createParameterSelector(p => p.groupName),
  (allProjectIdsByGroup, groupName) => {
    if (!groupName) return [];
    return allProjectIdsByGroup.get(groupName) || [];
  },
);
