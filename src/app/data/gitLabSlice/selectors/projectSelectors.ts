import { createSelector } from '@reduxjs/toolkit';
import moment from 'moment';
import { createParameterSelector, selectGitlabSlice } from './selectors';

export const selectProjects = createSelector(
  selectGitlabSlice,
  state => state.projects,
);

export const selectProjectsByGroup = createSelector(
  selectProjects,
  createParameterSelector(p => p.groupName),
  (projects, groupName) => {
    if (!groupName) return [];
    return projects.filter(
      project => project && project.path_with_namespace.includes(groupName),
    );
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
