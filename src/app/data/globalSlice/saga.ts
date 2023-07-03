import * as Effects from 'redux-saga/effects';
import { LOCALSTORAGE_KEY } from '.';
import { globalActions } from 'app';
import * as PersistanceAPI from 'app/apis/persistance';
import { selectGlobal } from './selectors';
import { takeEvery } from 'redux-saga/effects';

const { select, call } = Effects;
const takeLatest: any = Effects.takeLatest;

function* persist() {
  const state = yield select(selectGlobal);
  const copiedState: any = Object.assign({}, state);
  // Don't save certain state fields
  delete copiedState.notifications;
  delete copiedState.loaders;
  yield call(PersistanceAPI.saveToLocalStorage, LOCALSTORAGE_KEY, copiedState);
}

export function* globalSaga() {
  yield takeLatest(globalActions.addVisualisation.type, persist);
  yield takeLatest(globalActions.removeVisualisation.type, persist);
  yield takeLatest(globalActions.setVisualisationProps.type, persist);
  yield takeEvery(globalActions.updateDashboardLayout.type, persist);
  yield takeEvery(globalActions.addDashboard.type, persist);
  yield takeEvery(globalActions.removeDashboard.type, persist);
  yield takeEvery(globalActions.setMainDashboard.type, persist);
}
