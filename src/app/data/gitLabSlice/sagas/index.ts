import * as PersistanceAPI from 'app/apis/persistance';
import * as Effects from 'redux-saga/effects';
import { all, fork, spawn, takeEvery, takeLeading } from 'redux-saga/effects';
import { SW_MESSAGE_TYPES } from 'service-worker';
import { LOCALSTORAGE_KEY, gitLabActions as actions } from '..';
import { selectConfigured, selectGitlabSlice } from '../selectors/selectors';
import { GitLabState } from '../types';
import { loadEvents } from './eventsSaga';
import { loadGroups } from './groupSagas';
import { loadMergeRequests } from './mrSagas';
import { loadPipelines, playJobs, rerunPipelines } from './pipelineSagas';
import { loadMissingProjects, loadProjects } from './projectSagas';
import { loadUserInfo, tryLoadingUserinfo } from './userSagas';

const { select, call, delay } = Effects;

function* pollLong() {
  while (true) {
    const configured: boolean = yield select(selectConfigured);
    yield delay(1000 * 60 * 60); // every 60 Minutes
    if (configured) {
      yield fork(loadUserInfo);
      yield call(loadGroups);
      yield call(loadProjects);
      yield call(persist);
    }
  }
}

function* pollShort() {
  while (true) {
    const configured: boolean = yield select(selectConfigured);
    yield delay(1000 * 60); // every minute
    if (configured) {
      yield all([call(loadMergeRequests), call(loadEvents)]);
      yield call(loadPipelines);
      yield call(loadMissingProjects);
      yield call(persist);
    }
  }
}

function* loadAll() {
  const configured: boolean = yield select(selectConfigured);
  if (!configured) return;
  const isAuthenticated = yield call(tryLoadingUserinfo);

  if (!isAuthenticated) {
    signalServiceWorker();
    return;
  }

  yield call(loadGroups); // All other calls depend on groups, block for this call

  yield all([call(loadProjects), call(loadMergeRequests)]);

  yield all([call(loadEvents), call(loadPipelines)]);

  yield call(loadMissingProjects);

  yield call(persist);
}

function* persist() {
  const state = yield select(selectGitlabSlice);
  const stateCopy: GitLabState = { ...state };
  // state can become quite large...
  stateCopy.events = [];
  yield call(PersistanceAPI.saveToLocalStorage, LOCALSTORAGE_KEY, stateCopy);
}

function* clear() {
  yield call(PersistanceAPI.clearLocalStorage, LOCALSTORAGE_KEY);
}

const signalServiceWorker = () => {
  if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
    return;
  }
  navigator.serviceWorker.controller.postMessage({
    type: SW_MESSAGE_TYPES.CHECK_AUTHENTICATED,
  });
};

export function* gitLabSaga() {
  yield takeLeading(actions.addGitlabVisualisation.type, loadAll);
  yield takeEvery(actions.cleanState.type, persist);
  yield takeLeading(actions.reload.type, loadAll);
  yield takeLeading(actions.deleteConfiguration.type, clear);
  yield takeEvery(actions.reloadPipeline.type, rerunPipelines);
  yield takeEvery(actions.playJob.type, playJobs);
  yield takeLeading(actions.setUrl.type, persist);
  yield takeLeading(actions.setApplicationId.type, persist);
  yield spawn(pollLong);
  yield spawn(pollShort);
}
