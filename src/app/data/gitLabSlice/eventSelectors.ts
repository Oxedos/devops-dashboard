import { createSelector } from 'reselect';
import { selectGitLab } from './selectors';

export const selectEvents = createSelector(selectGitLab, state => state.events);
export const selectEventIdsByProject = createSelector(
  selectGitLab,
  state => state.eventsByProject,
);
