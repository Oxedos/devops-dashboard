import { globalActions } from 'app/data/globalSlice';
import { put } from 'redux-saga/effects';

const loaderPrefix = '[GitLab] ';

export function* displayNotification(error: any) {
  if (error instanceof Error) {
    yield put(globalActions.addErrorNotification(`[GitLab] ${error.message}`));
  } else {
    yield put(globalActions.addErrorNotification(`[GitLab] Unknown Error`));
  }
}

export function* setLoader(loaderId: string) {
  yield put(globalActions.addLoader({ id: loaderPrefix + loaderId }));
  return loaderId;
}

export function* removeLoader(loaderId: string) {
  yield put(globalActions.removeLoader({ id: loaderPrefix + loaderId }));
}
