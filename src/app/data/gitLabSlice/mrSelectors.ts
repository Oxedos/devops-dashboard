import { createSelector } from 'reselect';
import {
  createParameterSelector,
  selectGitlabSlice,
  selectUserData,
} from './selectors';
import { selectPipelineByProjectIdAndMrIid } from './pipelineSelectors';
import { selectProjectByProjectId } from './projectSelectors';

export const selectMrIdsByGroup = createSelector(
  selectGitlabSlice,
  state => state.mrsByGroup,
);
export const selectAllMrs = createSelector(
  selectGitlabSlice,
  state => state.mrs,
);

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
  selectAllMrs,
  selectMrIdsByGroup,
  createParameterSelector(p => p.groupName),
  createParameterSelector(p => p.includeWIP),
  createParameterSelector(p => p.includeReady),
  (mrs, mrsByGroup, groupName, includeWIP, includeReady) => {
    if (!groupName) return [];
    const mrIds = mrsByGroup.get(groupName);
    if (!mrIds || mrIds.length <= 0) return [];
    return mrs
      .filter(mr => mrIds.includes(mr.id))
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
