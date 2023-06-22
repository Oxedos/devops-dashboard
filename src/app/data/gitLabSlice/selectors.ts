import { createSelector } from '@reduxjs/toolkit';

import { RootState } from 'types';
import { initialState, uniqueGroupListeners } from '.';

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
export const selectListenedGroups = createSelector(selectGitLab, state =>
  uniqueGroupListeners(state),
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

export function createParameterSelector(selector) {
  return (_, params) => selector(params);
}
