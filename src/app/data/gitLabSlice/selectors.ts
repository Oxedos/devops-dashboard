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
export const selectMrsByGroup = createSelector(
  selectGitLab,
  state => state.mrsByGroup,
);
export const selectAllMrs = createSelector(selectGitLab, state => state.mrs);
export const selectMrsUserAssigned = createSelector(
  selectGitLab,
  state => state.mrsUserAssigned,
);
export const selectProjects = createSelector(
  selectGitLab,
  state => state.projects,
);
export const selectIssueStatistics = createSelector(
  selectGitLab,
  state => state.issueStatisticsByGroup,
);
export const selectIssueStatisticsAll = createSelector(
  selectGitLab,
  state => state.issueStatisticsAll,
);
export const selectListenedGroups = createSelector(selectGitLab, state =>
  uniqueGroupListeners(state),
);
export const selectProjectsByGroup = createSelector(
  selectGitLab,
  state => state.projectsByGroup,
);
export const selectPipelinesByGroup = createSelector(
  selectGitLab,
  state => state.pipelinesByGroup,
);
export const selectPipelinesToReload = createSelector(
  selectGitLab,
  state => state.pipelinesToReload,
);
