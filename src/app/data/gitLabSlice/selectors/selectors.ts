import { createSelector } from '@reduxjs/toolkit';

import { RootState } from 'types';
import { initialState } from '../index';

export const selectGitlabSlice = (state: RootState) =>
  state ? state.gitLab || initialState : initialState;

export const selectConfigured = createSelector(
  selectGitlabSlice,
  state => state.url && state.applicationId,
);
export const selectUrl = createSelector(selectGitlabSlice, state => state.url);
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

export const selectApplicationId = createSelector(
  selectGitlabSlice,
  state => state.applicationId,
);
