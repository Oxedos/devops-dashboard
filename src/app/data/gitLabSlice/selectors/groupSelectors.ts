import { createSelector } from 'reselect';
import { createParameterSelector, selectGitlabSlice } from './selectors';
import {
  selectConfiguredVisualisations,
  selectGlobal,
} from '../../globalSlice/selectors';
import { VisualisationType } from '../../VisualisationTypes';

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
  configuredVisualisations => {
    const groupsForMrTableVis = configuredVisualisations
      .filter(vis => vis && vis.type === VisualisationType.GITLAB_MR_TABLE)
      .map(vis => ({
        group: vis.props?.group,
        includeBranches: true,
        includeMrs: true,
        includeFailed: true,
        includeSuccess: true,
        includeCanceled: true,
        includeRunning: true,
        includeCreated: true,
        includeManual: true,
      }))
      .filter(groupConfig => !!groupConfig.group);
    const groupsForPipelinesVis = configuredVisualisations
      .filter(
        vis => vis && vis.type === VisualisationType.GITLAB_PIPELINES_TABLE,
      )
      .map(vis => ({
        group: vis.props?.group,
        includeBranches: !!vis.props?.displayPipelinesForBranches,
        includeMrs: !!vis.props?.displayPipelinesForMRs,
        includeFailed: !!vis.props?.pipelines_failed,
        includeSuccess: !!vis.props?.pipelines_success,
        includeCanceled: !!vis.props?.pipelines_canceled,
        includeRunning: !!vis.props?.pipelines_running,
        includeCreated: !!vis.props?.pipelines_created,
        includeManual: !!vis.props?.pipelines_manual,
      }));
    return Array.from(
      [...groupsForMrTableVis, ...groupsForPipelinesVis]
        .filter(groupConfig => !!groupConfig.group)
        .reduce((acc, curr) => {
          if (!acc.has(curr.group)) {
            acc.set(curr.group, curr);
            return acc;
          }
          const accGroup = acc.get(curr.group);
          acc.set(curr.group, {
            group: curr.group,
            includeBranches: curr.includeBranches || accGroup.includeBranches,
            includeMrs: curr.includeMrs || accGroup.includeMrs,
            includeFailed: curr.includeFailed || accGroup.includeFailed,
            includeSuccess: curr.includeSuccess || accGroup.includeSuccess,
            includeCanceled: curr.includeCanceled || accGroup.includeCanceled,
            includeRunning: curr.includeRunning || accGroup.includeRunning,
            includeCreated: curr.includeCreated || accGroup.includeCreated,
            includeManual: curr.includeManual || accGroup.includeManual,
          });
          return acc;
        }, new Map<String, any>())
        .values(),
    );
  },
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
export const selectGroupByGroupName = createSelector(
  selectGroups,
  createParameterSelector(p => p.groupName),
  (groups, groupName) => {
    if (!groupName) return undefined;
    return groups.find(group => group.full_name === groupName);
  },
);
