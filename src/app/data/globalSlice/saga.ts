import * as Effects from 'redux-saga/effects';
import { globalActions as actions, LOCALSTORAGE_KEY } from '.';
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
  yield takeLatest(actions.addVisualisation.type, persist);
  yield takeLatest(actions.removeVisualisation.type, persist);
  yield takeLatest(actions.setVisualisationProps.type, persist);
  yield takeEvery(actions.updateDashboardLayout.type, persist);
  yield takeEvery(actions.addDashboard.type, persist);
  yield takeEvery(actions.removeDashboard.type, persist);
  yield takeEvery(actions.setMainDashboard.type, persist);
}
