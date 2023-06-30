import { getGroups } from 'app/apis/gitlab';
import { GitLabGroup } from 'app/apis/gitlab/types';
import { call, put, select } from 'redux-saga/effects';
import { gitLabActions as actions } from '..';
import { selectUrl } from '../selectors/selectors';
import { displayNotification, removeLoader, setLoader } from './sagaHelper';

export function* loadGroups() {
  const url: string = yield select(selectUrl);
  const loaderId = yield call(setLoader, 'Groups');

  try {
    const groups: GitLabGroup[] = yield call(getGroups, url);
    yield put(actions.setGroups(groups));
  } catch (error) {
    yield call(displayNotification, error);
  } finally {
    yield call(removeLoader, loaderId);
  }
}
