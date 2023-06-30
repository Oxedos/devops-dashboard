import {
  getGroupMergeRequests,
  getMrsWithReviewer,
  getUserAssignedMrs,
} from 'app/apis/gitlab';
import { GitLabGroup, GitLabUserData } from 'app/apis/gitlab/types';
import { call, put, select } from 'redux-saga/effects';
import { gitLabActions as actions } from '..';
import { selectGroupsListeningForMrs } from '../selectors/groupSelectors';
import {
  mustLoadMRsUserIsReviewing,
  mustLoadUserAssignedMRs,
} from '../selectors/mrSelectors';
import { selectUrl, selectUserData } from '../selectors/selectors';
import { displayNotification, removeLoader, setLoader } from './sagaHelper';

export function* loadMergeRequests() {
  const loaderId = yield call(setLoader, 'MergeRequests');
  yield call(loadUserAssignedMrs);
  yield call(loadMrsWithUserAsReviewer);
  yield call(loadGroupMergeRequests);
  yield call(removeLoader, loaderId);
}

function* loadGroupMergeRequests() {
  const url: string = yield select(selectUrl);
  const groupConfigsListeningForMrs: {
    group: GitLabGroup;
    includeWIP: boolean;
  }[] = yield select(selectGroupsListeningForMrs);

  if (!groupConfigsListeningForMrs || groupConfigsListeningForMrs.length <= 0) {
    return;
  }

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
      yield call(displayNotification, error);
    }
  }
}

function* loadUserAssignedMrs() {
  const mustLoad = yield select(mustLoadUserAssignedMRs);
  if (!mustLoad) return;
  const url: string = yield select(selectUrl);

  try {
    const mrsUserAssigned = yield call(getUserAssignedMrs, url);
    yield put(actions.setMrs({ mrs: mrsUserAssigned }));
  } catch (error) {
    yield call(displayNotification, error);
  }
}

function* loadMrsWithUserAsReviewer() {
  const mustLoad = yield select(mustLoadMRsUserIsReviewing);
  if (!mustLoad) return;
  const url: string = yield select(selectUrl);
  const userData: GitLabUserData = yield select(selectUserData);
  if (!userData) return;

  try {
    const mrs = yield call(getMrsWithReviewer, userData.id, url);
    yield put(actions.setMrs({ mrs: mrs }));
  } catch (error) {
    yield call(displayNotification, error);
  }
}
