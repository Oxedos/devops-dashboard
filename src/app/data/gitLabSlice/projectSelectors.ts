import { createSelector } from '@reduxjs/toolkit';
import {
  selectGroupNamesListeningForEvents,
  selectListenedGroups,
} from './groupSelectors';
import { createParameterSelector, selectGitlabSlice } from './selectors';

export const selectProjects = createSelector(
  selectGitlabSlice,
  state => state.projects,
);

export const selectAllProjectIdsByGroup = createSelector(
  selectGitlabSlice,
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

export const selectProjectsByGroup = createSelector(
  selectProjects,
  selectProjectIdsByGroup,
  (projects, projectIds) => {
    if (!projectIds) return [];
    return projects.filter(project => projectIds.includes(project.id));
  },
);

export const selectListenedProjectIds = createSelector(
  selectListenedGroups,
  selectAllProjectIdsByGroup,
  (listenedGroups, projectIdsByGroup) => {
    if (!listenedGroups || listenedGroups.length <= 0) return [];
    return listenedGroups
      .map(groupName => projectIdsByGroup.get(groupName))
      .filter(projectIds => !!projectIds && projectIds.length > 0)
      .flat()
      .filter(projectId => !!projectId);
  },
);

export const selectProjectIdsListeningForEvents = createSelector(
  selectAllProjectIdsByGroup,
  selectGroupNamesListeningForEvents,
  (projectIdsByGroup, groupsListeningForEvents) => {
    if (!groupsListeningForEvents || groupsListeningForEvents.length <= 0)
      return [];
    groupsListeningForEvents
      .map(group => projectIdsByGroup.get(group))
      .filter(projectId => !!projectId);
  },
);
