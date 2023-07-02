import moment from 'moment';
import { createSelector } from 'reselect';
import { selectProjectsByGroup } from './projectSelectors';
import { createParameterSelector, selectGitlabSlice } from './selectors';

export const selectEvents = createSelector(
  selectGitlabSlice,
  slice => slice.events,
);

export const selectEventsByGroup = createSelector(
  selectEvents,
  selectProjectsByGroup,
  createParameterSelector(p => p.maxCount),
  (events, projects, maxCount) => {
    if (!events) return [];
    if (!projects) return [];
    const projectIds = projects.map(project => project.id);
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
        project: projects.find(p => p.id === event.project_id),
      }));
  },
);
