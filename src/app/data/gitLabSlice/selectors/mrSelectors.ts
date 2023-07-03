import { GitLabMR } from 'app/apis/gitlab/types';
import { VisualisationType } from 'app/data/VisualisationTypes';
import { selectConfiguredVisualisations } from 'app/data/globalSlice/selectors';
import { createSelector } from 'reselect';
import {
  createParameterSelector,
  selectGitlabSlice,
  selectUserData,
} from './selectors';

export const selectAllMrs = createSelector(selectGitlabSlice, state => {
  if (!state || !state.mrs || state.mrs.length <= 0) return [];
  return state.mrs;
});

export const selectMrsByGroup = createSelector(
  selectGitlabSlice,
  createParameterSelector(p => p.groupName),
  (state, groupName) => {
    if (!groupName) return [];
    if (!state.mrs || state.mrs.length <= 0) return [];
    return state.mrs.filter(mr => {
      if (!mr) return false;
      const project = state.projects.find(
        project => project.id === mr.project_id,
      );
      if (!project) return false;
      return project.path_with_namespace.includes(groupName);
    });
  },
);

export const selectUserAssignedMrs = createSelector(
  selectAllMrs,
  selectUserData,
  (allMrs, userData) => {
    if (!allMrs || allMrs.length <= 0) return [];
    if (!userData) return [];
    return allMrs.filter(
      mr =>
        (mr &&
          mr.assignee &&
          userData &&
          userData.id &&
          mr.assignee.id === userData.id) ||
        (mr.assignees &&
          userData &&
          userData.id &&
          mr.assignees.length >= 1 &&
          mr.assignees.map(assignee => assignee.id).includes(userData.id)),
    );
  },
);

export const selectMrsWithUserAsReviewer = createSelector(
  selectAllMrs,
  selectUserData,
  (allMrs, userData) => {
    if (!allMrs || allMrs.length <= 0) return [];
    if (!userData) return [];
    return allMrs.filter(
      mr =>
        mr.reviewers &&
        userData &&
        userData.id &&
        mr.reviewers.length >= 1 &&
        mr.reviewers.map(reviewer => reviewer.id).includes(userData.id),
    );
  },
);

// precedence: assignedToUserOnly > userAsReviewer > groupName
export const selectMrsFiltered = createSelector(
  selectAllMrs,
  selectMrsByGroup,
  selectUserData,
  createParameterSelector(p => p.includeWIP),
  createParameterSelector(p => p.includeReady),
  createParameterSelector(p => p.assignedToUserOnly),
  createParameterSelector(p => p.userAsReviewer),
  (
    allMrs,
    groupMrs,
    userData,
    includeWIP,
    includeReady,
    assignedToUserOnly,
    userAsReviewer,
  ) => {
    let mrs: GitLabMR[] = [];
    if (assignedToUserOnly) {
      mrs = allMrs.filter(
        mr =>
          (mr.assignee &&
            userData &&
            userData.id &&
            mr.assignee.id === userData.id) ||
          (mr.assignees &&
            userData &&
            userData.id &&
            mr.assignees.length >= 1 &&
            mr.assignees.map(assignee => assignee.id).includes(userData.id)),
      );
    } else if (userAsReviewer) {
      mrs = allMrs.filter(
        mr =>
          mr.reviewers &&
          userData &&
          userData.id &&
          mr.reviewers.length >= 1 &&
          mr.reviewers.map(reviewer => reviewer.id).includes(userData.id),
      );
    } else {
      mrs = groupMrs;
    }
    return mrs
      .filter(
        mr =>
          (includeWIP && includeReady) ||
          (includeReady && !mr.work_in_progress) ||
          (includeWIP && mr.work_in_progress),
      )
      .sort((x, y) => {
        const dateX: any = new Date(x.updated_at || x.created_at);
        const dateY: any = new Date(y.updated_at || y.created_at);
        return dateY - dateX;
      });
  },
);

export const mustLoadUserAssignedMRs = createSelector(
  selectConfiguredVisualisations,
  configuredVisualisations =>
    configuredVisualisations
      .filter(vis => vis && vis.type === VisualisationType.GITLAB_MR_TABLE)
      .filter(vis => vis.props && !!vis.props.assignedToUserOnly).length > 0,
);

export const mustLoadMRsUserIsReviewing = createSelector(
  selectConfiguredVisualisations,
  configuredVisualisations =>
    configuredVisualisations
      .filter(vis => vis && vis.type === VisualisationType.GITLAB_MR_TABLE)
      .filter(vis => vis.props && !!vis.props.userAsReviewer).length > 0,
);
