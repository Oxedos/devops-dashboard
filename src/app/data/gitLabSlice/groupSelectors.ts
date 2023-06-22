import { createSelector } from 'reselect';
import { createParameterSelector, selectGitlabSlice } from './selectors';
import { uniqueGroupListeners } from '.';

export const selectGroups = createSelector(
  selectGitlabSlice,
  state => state.groups,
);

export const selectGroupNames = createSelector(selectGroups, groups => {
  if (!groups || groups.length <= 0) return [];
  return groups.map(group => group.full_name).sort();
});

export const selectListenedGroups = createSelector(selectGitlabSlice, state =>
  uniqueGroupListeners(state),
);

export const selectGroupByGroupName = createSelector(
  selectGroups,
  createParameterSelector(p => p.groupName),
  (groups, groupName) => {
    if (!groupName) return undefined;
    return groups.find(group => group.full_name === groupName);
  },
);

export const selectListenedGroupsFull = createSelector(
  selectGroups,
  selectListenedGroups,
  (groups, listenedGroupNames) => {
    if (!listenedGroupNames || listenedGroupNames.length <= 0) return [];
    return listenedGroupNames
      .map(groupName => groups.find(g => g.full_name === groupName))
      .filter(group => !!group);
  },
);
