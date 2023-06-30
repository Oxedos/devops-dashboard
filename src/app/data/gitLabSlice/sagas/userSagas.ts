import { getUserInfo } from 'app/apis/gitlab';
import { GitLabUserData } from 'app/apis/gitlab/types';
import { globalActions } from 'app/data/globalSlice';
import { call, put, select } from 'redux-saga/effects';
import { gitLabActions as actions } from '..';
import { selectUrl } from '../selectors/selectors';

export function* loadUserInfo() {
  const url: string = yield select(selectUrl);
  const loadingId = '[GitLab] getUserInfo';
  yield put(globalActions.addLoader({ id: loadingId }));

  // Get user data
  try {
    const userInfo: GitLabUserData = yield call(getUserInfo, url);
    yield put(actions.setUserData(userInfo));
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        globalActions.addErrorNotification(`[GitLab] ${error.message}`),
      );
    } else {
      yield put(globalActions.addErrorNotification(`[GitLab] Unknown Error`));
    }
  } finally {
    yield put(globalActions.removeLoader({ id: loadingId }));
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
