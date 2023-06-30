import { globalActions } from 'app/data/globalSlice';
import { call, put, select } from 'redux-saga/effects';
import { gitLabActions as actions } from '..';
import { selectUrl, selectUserData } from '../selectors/selectors';
import { GitLabGroup, GitLabUserData } from 'app/apis/gitlab/types';
import { selectGroupsListeningForMrs } from '../selectors/groupSelectors';
import {
  getGroupMergeRequests,
  getMrsWithReviewer,
  getUserAssignedMrs,
} from 'app/apis/gitlab';

export function* loadMergeRequests() {
  const url: string = yield select(selectUrl);
  const groupConfigsListeningForMrs: {
    group: GitLabGroup;
    includeWIP: boolean;
  }[] = yield select(selectGroupsListeningForMrs);

  if (!groupConfigsListeningForMrs || groupConfigsListeningForMrs.length <= 0)
    return;

  const loadingId = '[GitLab] getMergeRequests';
  yield put(globalActions.addLoader({ id: loadingId }));

  // Get all MRs for listened groups
  for (let groupConfig of groupConfigsListeningForMrs) {
    if (!groupConfig || !groupConfig.group) continue;
    try {
      const groupsMrs = yield call(
        getGroupMergeRequests,
        url,
        groupConfig.group.id,
      );
      yield put(
        actions.setMrs({
          groupName: groupConfig.group.full_name,
          mrs: groupsMrs,
        }),
      );
    } catch (error) {
      if (error instanceof Error) {
        yield put(
          globalActions.addErrorNotification(`[GitLab] ${error.message}`),
        );
      } else {
        yield put(globalActions.addErrorNotification(`[GitLab] Unknown Error`));
      }
    }
  }
  yield put(globalActions.removeLoader({ id: loadingId }));
}

export function* loadUserAssignedMrs() {
  const url: string = yield select(selectUrl);
  const loadingId = '[GitLab] getUserAssignedMRs';
  yield put(globalActions.addLoader({ id: loadingId }));

  try {
    const mrsUserAssigned = yield call(getUserAssignedMrs, url);
    yield put(actions.setMrs({ mrs: mrsUserAssigned }));
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

export function* loadMrsWithUserAsReviewer() {
  const url: string = yield select(selectUrl);
  const userData: GitLabUserData = yield select(selectUserData);
  if (!userData) return;

  const loadingId = '[GitLab] getMrsWithUserAsReviewer';
  yield put(globalActions.addLoader({ id: loadingId }));

  try {
    const mrs = yield call(getMrsWithReviewer, userData.id, url);
    yield put(actions.setMrs({ mrs: mrs }));
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
