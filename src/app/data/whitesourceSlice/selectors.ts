import { createSelector } from '@reduxjs/toolkit';

import { RootState } from 'types';
import { initialState } from '.';

const selectSlice = (state: RootState) => state.whitesource || initialState;

export const selectWhitesource = createSelector([selectSlice], state => state);
export const selectUrl = createSelector([selectSlice], state => state.url);
export const selectConfigured = createSelector(
  [selectSlice],
  state => state.configured,
);
export const selectUserKey = createSelector(
  [selectSlice],
  state => state.userKey,
);
export const selectProductToken = createSelector(
  [selectSlice],
  state => state.productToken,
);
export const selectProjects = createSelector(
  [selectSlice],
  state => state.projects,
);
export const selectVulnerabilities = createSelector(
  [selectSlice],
  state => state.vulnerabilities,
);
