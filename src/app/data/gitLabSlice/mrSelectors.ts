import { createSelector } from 'reselect';
import {
  selectPipelineByProjectIdAndMrIid,
  selectPipelinesByGroup,
} from './pipelineSelectors';
import {
  selectProjectByProjectId,
  selectProjectsByGroup,
} from './projectSelectors';
import {
  createParameterSelector,
  selectGitlabSlice,
  selectUserData,
} from './selectors';

export const selectMrIdsByGroup = createSelector(
  selectGitlabSlice,
  state => state.mrsByGroup,
);

export const selectAllMrs = createSelector(selectGitlabSlice, state => {
  if (!state || !state.mrs || state.mrs.length <= 0) return [];
  return state.mrs;
});

export const selectMrsUserAssigned = createSelector(
  selectUserData,
  selectAllMrs,
  (userData, allMrs) => {
    if (!userData || !userData.id) return [];
    if (!allMrs || allMrs.length <= 0) return [];
    return allMrs
      .filter(
        mr =>
          (mr.assignee && mr.assignee.id === userData.id) ||
          (mr.assignees &&
            mr.assignees.length > 1 &&
            mr.assignees.map(assignee => assignee.id).includes(userData.id)),
      )
      .sort((x, y) => {
        const dateX: any = new Date(x.updated_at || x.created_at);
        const dateY: any = new Date(y.updated_at || y.created_at);
        return dateY - dateX;
      })
      .map(mr => ({
        ...mr,
        pipeline: selectPipelineByProjectIdAndMrIid(selectGitlabSlice, {
          projectId: mr.project_id,
          mrIid: mr.iid,
        }),
        project: selectProjectByProjectId(selectGitlabSlice, {
          projectId: mr.project_id,
        }),
      }));
  },
);

export const selectMrsByGroup = createSelector(
  selectGitlabSlice,
  selectMrIdsByGroup,
  createParameterSelector(p => p.groupName),
  (state, mrsByGroup, groupName) => {
    if (!groupName) return [];
    if (!mrsByGroup) return [];
    if (!state.mrs || state.mrs.length <= 0) return [];
    const mrIds = mrsByGroup.get(groupName);
    if (!mrIds || mrIds.length <= 0) return [];
    return state.mrs.filter(mr => mrIds.includes(mr.id));
  },
);

export const selectMrsByGroupFiltered = createSelector(
  selectMrsByGroup,
  createParameterSelector(p => p.includeWIP),
  createParameterSelector(p => p.includeReady),
  (groupMrs, includeWIP, includeReady) => {
    return groupMrs
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
