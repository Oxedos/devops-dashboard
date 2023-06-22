import { createSelector } from '@reduxjs/toolkit';

import { RootState } from 'types';
import { initialState } from '.';

export const selectGitlabSlice = (state: RootState) =>
  state.gitLab || initialState;

export const selectConfigured = createSelector(
  selectGitlabSlice,
  state => state.configured,
);
export const selectUrl = createSelector(selectGitlabSlice, state => state.url);
export const selectToken = createSelector(
  selectGitlabSlice,
  state => state.token,
);
export const selectUserId = createSelector(
  selectGitlabSlice,
  state => state.userId,
);
export const selectUserData = createSelector(
  selectGitlabSlice,
  state => state.userData,
);
export const selectJobsToPlay = createSelector(
  selectGitlabSlice,
  state => state.jobsToPlay,
);

export function createParameterSelector(selector) {
  return (_, params) => selector(params);
}
