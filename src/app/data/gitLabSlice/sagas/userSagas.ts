import { getUserInfo } from 'app/apis/gitlab';
import { GitLabUserData } from 'app/apis/gitlab/types';
import { call, put, select } from 'redux-saga/effects';
import { gitLabActions as actions } from '..';
import { selectUrl } from '../selectors/selectors';
import { displayNotification, removeLoader, setLoader } from './sagaHelper';

export function* loadUserInfo() {
  const url: string = yield select(selectUrl);
  const loaderId = yield call(setLoader, 'User Info');

  try {
    const userInfo: GitLabUserData = yield call(getUserInfo, url);
    yield put(actions.setUserData(userInfo));
  } catch (error) {
    yield call(displayNotification, error);
  } finally {
    yield call(removeLoader, loaderId);
  }
}

export function* tryLoadingUserinfo() {
  const url = yield select(selectUrl);
  try {
    const userInfo = yield call(getUserInfo, url);
    yield put(actions.setUserData(userInfo));
    return true;
  } catch (error) {
    return false;
  }
}
