import { getEvents } from 'app/apis/gitlab';
import { GitLabEvent, GitLabProject } from 'app/apis/gitlab/types';
import moment from 'moment';
import { call, put, select } from 'redux-saga/effects';
import { gitLabActions } from '..';
import { selectGroupNamesListeningForEvents } from '../selectors/groupSelectors';
import { selectProjectsByGroupSortedByLatestActivity } from '../selectors/projectSelectors';
import { selectUrl } from '../selectors/selectors';
import { displayNotification, removeLoader, setLoader } from './sagaHelper';

export function* loadEvents() {
  const loaderId = yield call(setLoader, 'Events');
  yield call(loadEventsForGroups);
  yield call(removeLoader, loaderId);
}

function* loadEventsForGroups() {
  const url: string = yield select(selectUrl);
  const listenedGroups: string[] = yield select(
    selectGroupNamesListeningForEvents,
  );
  if (!listenedGroups || listenedGroups.length <= 0) return;
  for (let groupName of listenedGroups) {
    const listenedProjects: GitLabProject[] = yield select(
      selectProjectsByGroupSortedByLatestActivity,
      { groupName },
    );
    let eventCount = 0;
    let i = 0;
    // TODO: Make this magic number user configurable
    while (eventCount < 20 && i < listenedProjects.length) {
      const project = listenedProjects[i];
      if (!project) continue;
      const events: GitLabEvent[] = yield call(
        getEventsForProject,
        project.id,
        url,
      );
      eventCount += events.length;
      i += 1;
      yield put(
        gitLabActions.setEvents({ assoicatedId: project.id, items: events }),
      );
    }
  }
}

function* getEventsForProject(projectId: number, url: string) {
  try {
    const after = moment().subtract(1, 'day').format('YYYY-MM-DD');
    return yield call(getEvents, url, projectId, after);
  } catch (error) {
    yield call(displayNotification, error);
    return [];
  }
}
