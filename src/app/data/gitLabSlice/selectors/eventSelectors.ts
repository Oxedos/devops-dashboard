import { createSelector } from 'reselect';
import { createParameterSelector, selectGitlabSlice } from './selectors';
import {
  selectProjectByProjectId,
  selectProjectIdsByGroup,
} from './projectSelectors';
import moment from 'moment';

export const selectEvents = createSelector(
  selectGitlabSlice,
  slice => slice.events,
);

export const selectAllEventIdsByProject = createSelector(
  selectGitlabSlice,
  state => state.eventsByProject,
);

export const selectEventIdsByProjectId = createSelector(
  selectAllEventIdsByProject,
  createParameterSelector(p => p.projectId),
  (allEventIdsByProject, projectId) => {
    if (!projectId) return [];
    return allEventIdsByProject.get(projectId) || [];
  },
);

export const selectEventsByGroup = createSelector(
  selectEvents,
  selectProjectIdsByGroup,
  createParameterSelector(p => p.maxCount),
  (events, projectIds, maxCount) => {
    if (!events) return [];
    if (!projectIds) return [];
    return events
      .filter(event => projectIds.includes(event.project_id))
      .sort((a, b) => {
        if (!a || !b) return 0;
        const momentA: any = moment(a.created_at);
        const momentB: any = moment(b.created_at);
        return momentB - momentA;
      })
      .slice(0, maxCount)
      .map(event => ({
        ...event,
        project: selectProjectByProjectId(selectGitlabSlice, {
          projectId: event.project_id,
        }),
      }));
  },
);
