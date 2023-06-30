import { globalActions } from 'app/data/globalSlice';
import { call, put, select } from 'redux-saga/effects';
import { gitLabActions as actions } from '..';
import { selectUrl } from '../selectors/selectors';
import { GitLabGroup } from 'app/apis/gitlab/types';
import { getGroups } from 'app/apis/gitlab';

export function* loadGroups() {
  const url: string = yield select(selectUrl);
  const loadingId = '[GitLab] getGroups';
  yield put(globalActions.addLoader({ id: loadingId }));

  // Get Groups
  try {
    const groups: GitLabGroup[] = yield call(getGroups, url);
    yield put(actions.setGroups(groups));
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
