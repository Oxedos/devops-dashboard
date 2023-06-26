import { createSelector } from 'reselect';
import { createParameterSelector, selectGitlabSlice } from './selectors';
import {
  selectConfiguredVisualisations,
  selectGlobal,
} from '../globalSlice/selectors';

export const selectGroups = createSelector(
  selectGitlabSlice,
  state => state.groups,
);

export const selectGroupNames = createSelector(selectGroups, groups => {
  if (!groups || groups.length <= 0) return [];
  return groups.map(group => group.full_name).sort();
});

export const selectListenedGroups = createSelector(
  selectConfiguredVisualisations,
  configuredVisualisation => {
    if (!configuredVisualisation) return [];
    return [
      ...new Set( // unique groups
        configuredVisualisation
          .map(vis => vis.props?.group)
          .filter(group => !!group),
      ),
    ];
  },
);

export const selectListenedGroupsForPipelines = createSelector(
  selectGlobal,
  state => {},
);

export const selectAbandonedGroups = createSelector(
  selectGitlabSlice,
  selectListenedGroups,
  (state, listenedGroups) => {
    if (!state) return [];
    const groupsWithData = [
      ...new Set(
        new Array(state.mrsByGroup.keys())
          .concat(new Array(state.projectsByGroup.keys()))
          .concat(new Array(state.pipelinesByGroup.keys())),
      ),
    ];
    return groupsWithData.filter(group => !listenedGroups.includes(group));
  },
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
