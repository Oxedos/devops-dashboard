import { getEvents } from 'app/apis/gitlab';
import { GitLabEvent, GitLabProject } from 'app/apis/gitlab/types';
import moment from 'moment';
import { call, put, select } from 'redux-saga/effects';
import { gitLabActions } from 'app';
import { selectGroupNamesListeningForEvents } from '../selectors/groupSelectors';
import { selectProjectsByGroupSortedByLatestActivity } from '../selectors/projectSelectors';
import { selectUrl } from '../selectors/selectors';
import { displayNotification, removeLoader, setLoader } from './sagaHelper';

export function* loadEvents() {
  const loaderId = yield call(setLoader, 'Events');
  const events = yield call(getEventsForGroups);
  yield put(gitLabActions.setEvents({ events }));
  yield call(removeLoader, loaderId);
}

function* getEventsForGroups() {
  const url: string = yield select(selectUrl);
  const listenedGroups: string[] = yield select(
    selectGroupNamesListeningForEvents,
  );
  if (!listenedGroups || listenedGroups.length <= 0) return [];
  let events: GitLabEvent[] = [];
  for (let groupName of listenedGroups) {
    const listenedProjects: GitLabProject[] = yield select(
      selectProjectsByGroupSortedByLatestActivity,
      { groupName },
    );
    if (listenedProjects.length <= 0) break;
    let eventCount = 0;
    let i = 0;
    // Calculate how many days back the last update was
    // This way we don't have to query so much data
    const lastActivityInGroupTs = moment(listenedProjects[0].last_activity_at);
    const now = moment();
    const diffDays = now.diff(lastActivityInGroupTs, 'days') + 1;
    // TODO: Make this magic number user configurable
    while (eventCount < 20 && i < listenedProjects.length) {
      const project = listenedProjects[i];
      if (!project) continue;
      const projectEvents: GitLabEvent[] = yield call(
        getEventsForProject,
        project.id,
        diffDays,
        url,
      );
      events = [...events, ...projectEvents];
      eventCount += projectEvents.length;
      i += 1;
    }
  }
  return events;
}

function* getEventsForProject(
  projectId: number,
  dayOffset: number,
  url: string,
) {
  try {
    const after = moment().subtract(dayOffset, 'day').format('YYYY-MM-DD');
    return yield call(getEvents, url, projectId, after);
  } catch (error) {
    yield call(displayNotification, error);
    return [];
  }
}
