import * as PersistanceAPI from 'app/apis/persistance';
import * as Effects from 'redux-saga/effects';
import { all, fork, spawn, takeEvery, takeLeading } from 'redux-saga/effects';
import { SW_MESSAGE_TYPES } from 'service-worker';
import { LOCALSTORAGE_KEY } from '..';
import { gitLabActions } from 'app';
import {
  selectApplicationId,
  selectConfigured,
  selectGitlabSlice,
  selectUrl,
} from '../selectors/selectors';
import { GitLabState } from '../types';
import { loadEvents } from './eventsSaga';
import { loadGroups } from './groupSagas';
import { loadMergeRequests } from './mrSagas';
import { loadPipelines, playJobs, rerunPipelines } from './pipelineSagas';
import { loadProjects } from './projectSagas';
import { loadUserInfo, tryLoadingUserinfo } from './userSagas';
import { loadIssues } from './issueSagas';

const { select, call, delay } = Effects;

function* pollLong() {
  while (true) {
    const configured: boolean = yield select(selectConfigured);
    yield delay(1000 * 60 * 60); // every 60 Minutes
    if (configured) {
      const isAuthenticated = yield call(tryLoadingUserinfo);
      if (!isAuthenticated) {
        signalServiceWorker();
        break;
      }
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
      const isAuthenticated = yield call(tryLoadingUserinfo);
      if (!isAuthenticated) {
        signalServiceWorker();
        break;
      }
      yield all([call(loadMergeRequests), call(loadEvents), call(loadIssues)]);
      yield call(loadPipelines);
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

  yield all([call(loadProjects), call(loadMergeRequests), call(loadIssues)]);

  yield all([call(loadEvents), call(loadPipelines)]);

  yield call(persist);
}

function* persist() {
  const state = yield select(selectGitlabSlice);
  yield call(PersistanceAPI.saveToStorage, LOCALSTORAGE_KEY, state);
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

function* loadPersistedData() {
  // Check if GitLab is configured
  const isConfigured = yield select(selectConfigured);
  if (isConfigured) return;

  let tries = 0;
  while (tries < 5) {
    const loadedStateData: GitLabState = yield call(
      PersistanceAPI.loadFromStorage,
      LOCALSTORAGE_KEY,
    );
    // Check if there actually is a persisted state
    if (
      !loadedStateData ||
      !loadedStateData.url ||
      !loadedStateData.applicationId
    ) {
      return;
    }
    // try and update the redux state
    yield Effects.put(gitLabActions.setFullState({ state: loadedStateData }));
    // wait a bit
    yield delay(100);
    const currentUrl = yield select(selectUrl);
    const currentAppId = yield select(selectApplicationId);
    if (currentUrl && currentAppId) return;
    // We were not successful -> wait a bit and try again
    tries += 1;
    yield delay(250);
  }
}

export function* gitLabSaga() {
  yield takeLeading(gitLabActions.addGitlabVisualisation.type, loadAll);
  yield takeLeading(gitLabActions.reload.type, loadAll);
  yield takeLeading(gitLabActions.deleteConfiguration.type, clear);
  yield takeEvery(gitLabActions.reloadPipeline.type, rerunPipelines);
  yield takeEvery(gitLabActions.playJob.type, playJobs);
  yield takeLeading(gitLabActions.setUrl.type, persist);
  yield takeLeading(gitLabActions.setApplicationId.type, persist);
  yield spawn(pollLong);
  yield spawn(pollShort);
  yield spawn(loadPersistedData);
}
