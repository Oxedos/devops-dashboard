import * as Effects from 'redux-saga/effects';
import { call, put, select, takeLatest, join } from 'redux-saga/effects';
import { globalActions } from 'app/data/globalSlice';
import * as API from 'app/apis/whitesource';
import { whitesourceActions, LOCALSTORAGE_KEY } from '.';
import * as PersistanceAPI from 'app/apis/persistance';
import {
  selectConfigured,
  selectProductToken,
  selectUrl,
  selectUserKey,
  selectWhitesource,
} from './selectors';
import {
  WhitesourceProject,
  WhitesourceVulnerability,
} from 'app/apis/whitesource/types';
import { fork } from 'redux-saga/effects';

const { delay } = Effects;

function* testConnection() {
  const configured: boolean = yield select(selectConfigured);
  if (!configured) return;

  const loadingId = '[WhiteSource] testConnection';
  yield put(globalActions.addLoader({ id: loadingId }));

  const url: string = yield select(selectUrl);
  const userKey: string = yield select(selectUserKey);
  const productToken: string = yield select(selectProductToken);

  // Get user data
  try {
    yield call(API.getProjects, url, userKey, productToken);
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        globalActions.addErrorNotification(`[Whitesource] ${error.message}`),
      );
    } else {
      yield put(
        globalActions.addErrorNotification(`[Whitesource] Unknown Error`),
      );
    }
    yield put(whitesourceActions.setConfigured(false));
    return;
  } finally {
    yield put(globalActions.removeLoader({ id: loadingId }));
  }
  yield put(
    globalActions.addNotification(`[Whitesource] Successfuly connected`),
  );
  yield call(persist);
  yield call(loadAll);
}

function* loadProjects() {
  const url: string = yield select(selectUrl);
  const userKey: string = yield select(selectUserKey);
  const productToken: string = yield select(selectProductToken);

  const loadingId = '[WhiteSource] loadProjects';
  yield put(globalActions.addLoader({ id: loadingId }));

  try {
    const projects: WhitesourceProject[] = yield call(
      API.getProjects,
      url,
      userKey,
      productToken,
    );
    yield put(whitesourceActions.setProjects({ projects }));
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        globalActions.addErrorNotification(`[WhiteSource] ${error.message}`),
      );
    } else {
      yield put(
        globalActions.addErrorNotification(`[WhiteSource] Unknown Error`),
      );
    }
  } finally {
    yield put(globalActions.removeLoader({ id: loadingId }));
  }
}

function* loadVulnerabilities() {
  const url: string = yield select(selectUrl);
  const userKey: string = yield select(selectUserKey);
  const productToken: string = yield select(selectProductToken);

  const loadingId = '[WhiteSource] loadVulnerabilities';
  yield put(globalActions.addLoader({ id: loadingId }));

  try {
    const vulnerabilities: WhitesourceVulnerability[] = yield call(
      API.getVulnerabilites,
      url,
      userKey,
      productToken,
    );
    yield put(whitesourceActions.setVulnerabilities({ vulnerabilities }));
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        globalActions.addErrorNotification(`[WhiteSource] ${error.message}`),
      );
    } else {
      yield put(
        globalActions.addErrorNotification(`[WhiteSource] Unknown Error`),
      );
    }
  } finally {
    yield put(globalActions.removeLoader({ id: loadingId }));
  }
}

function* pollShort() {
  while (true) {
    const configured: boolean = yield select(selectConfigured);
    if (configured) {
      const task1 = yield fork(loadVulnerabilities);
      const taks2 = yield fork(loadProjects);
      yield join([task1, taks2]);
      yield call(persist);
      yield delay(1000 * 60 * 60); // every hour
    }
  }
}

function* persist() {
  const state = yield select(selectWhitesource);
  yield call(PersistanceAPI.saveToLocalStorage, LOCALSTORAGE_KEY, state);
}

function* loadAll() {
  const configured: boolean = yield select(selectConfigured);
  if (!configured) return;
  const task1 = yield fork(loadVulnerabilities);
  const taks2 = yield fork(loadProjects);
  yield join([task1, taks2]);
  yield call(persist);
}

export function* whitesourceSaga() {
  yield takeLatest(whitesourceActions.setConfigured.type, testConnection);
  yield takeLatest(whitesourceActions.deleteConfiguration.type, persist);
  yield takeLatest(whitesourceActions.reload.type, loadAll);
  yield fork(pollShort);
}
