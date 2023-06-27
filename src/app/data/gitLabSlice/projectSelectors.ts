import { createSelector } from '@reduxjs/toolkit';
import { selectListenedGroups } from './groupSelectors';
import { createParameterSelector, selectGitlabSlice } from './selectors';
import moment from 'moment';

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

export const selectProjectsByGroupSortedByLatestActivity = createSelector(
  selectProjectsByGroup,
  projectsByGroup => {
    if (!projectsByGroup || projectsByGroup.length <= 0) return [];
    return projectsByGroup.sort((a, b) => {
      if (!a || !b) return 0;
      const momentA: any = moment(a.last_activity_at);
      const momentB: any = moment(b.last_activity_at);
      return momentB - momentA;
    });
  },
);
