import moment from 'moment';
import { createSelector } from 'reselect';
import { selectProjectIdsByGroup, selectProjects } from './projectSelectors';
import { createParameterSelector, selectGitlabSlice } from './selectors';

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
  selectProjects,
  createParameterSelector(p => p.maxCount),
  (events, projectIds, allProjects, maxCount) => {
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
        project: allProjects.find(p => p.id === event.project_id),
      }));
  },
);
