import { createSelector } from 'reselect';
import { createParameterSelector, selectGitlabSlice } from './selectors';
import {
  selectConfiguredVisualisations,
  selectGlobal,
} from '../globalSlice/selectors';
import { VisualisationType } from '../VisualisationTypes';
import { GitLabGroup } from 'app/apis/gitlab/types';

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

export const selectGroupsListeningForPipelines = createSelector(
  selectConfiguredVisualisations,
  configuredVisualisations =>
    configuredVisualisations
      .filter(
        vis => vis && vis.type === VisualisationType.GITLAB_PIPELINES_TABLE,
      )
      .map(vis => ({
        group: vis.props?.group,
        includeBranches: vis.props?.displayPipelinesForBranches,
        includeMrs: vis.props?.displayPipelinesForMRs,
      }))
      .filter(groupConfig => !!groupConfig.group),
);

export const selectGroupsListeningForMrs = createSelector(
  selectConfiguredVisualisations,
  selectGroups,
  (configuredVisualisations, groups) =>
    configuredVisualisations
      .filter(
        vis =>
          (vis && vis.type === VisualisationType.GITLAB_MR_TABLE) ||
          vis.type === VisualisationType.GITLAB_PIPELINES_TABLE,
      )
      // Dot not include group if vis is configured for user assigned MRs
      .filter(vis => vis.props && !vis.props.assignedToUserOnly)
      .map(vis => ({
        group: vis.props?.group,
        includeWIP: vis.props?.includeWIP || false,
      }))
      .filter(groupConfig => !!groupConfig.group)
      .map(groupConfig => ({
        group: groups.find(g => g.full_name === groupConfig.group),
        includeWIP: !!groupConfig.includeWIP,
      })),
);

export const selectGroupNamesListeningForEvents = createSelector(
  selectConfiguredVisualisations,
  configuredVisualisations =>
    configuredVisualisations
      .filter(vis => vis && vis.type === VisualisationType.GITLAB_EVENTS)
      .map(vis => vis.props?.group)
      .filter(group => !!group),
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
