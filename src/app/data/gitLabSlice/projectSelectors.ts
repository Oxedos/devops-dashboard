import { createSelector } from '@reduxjs/toolkit';
import { createParameterSelector, selectProjects } from './selectors';

// export const selectProjectIdsByGroup = createSelector(
//   selectAllProjectIdsByGroup,
//   createParameterSelector(p => p.groupName),
//   (allProjectIdsByGroup, groupName) => {
//     if (!groupName) return [];
//     return allProjectIdsByGroup.get(groupName);
//   },
// );

// export const selectProjectsByGroup = createSelector(
//   selectProjects,
//   selectProjectIdsByGroup,
//   (projects, projectIdsByGroup) => {
//     if (!projectIdsByGroup || projectIdsByGroup.length <= 0) return [];
//     if (!projects || projects.length <= 0) return [];
//     return projects.filter(project => projectIdsByGroup.includes(project.id));
//   },
// );

export const selectProjectByProjectId = createSelector(
  selectProjects,
  createParameterSelector(p => p.projectId),
  (projects, projectId) => {
    if (!projectId) return undefined;
    return projects.find(project => project.id === projectId);
  },
);
