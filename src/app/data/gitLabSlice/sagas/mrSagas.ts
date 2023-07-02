import * as Api from 'app/apis/gitlab';
import { GitLabGroup, GitLabMR, GitLabUserData } from 'app/apis/gitlab/types';
import { call, put, select } from 'redux-saga/effects';
import { gitLabActions } from '..';
import { selectGroupsListeningForMrs } from '../selectors/groupSelectors';
import {
  mustLoadMRsUserIsReviewing,
  mustLoadUserAssignedMRs,
} from '../selectors/mrSelectors';
import { selectUrl, selectUserData } from '../selectors/selectors';
import { displayNotification, removeLoader, setLoader } from './sagaHelper';

export function* loadMergeRequests() {
  const loaderId = yield call(setLoader, 'MergeRequests');
  const userAssignedMrs: GitLabMR[] = yield call(getUserAssignedMrs);
  const userReviewingMrs: GitLabMR[] = yield call(getMrsWithUserAsReviewer);
  const groupMrs: GitLabMR[] = yield call(getGroupMergeRequests);
  // Combine them all together, making sure no MR is duplicate
  const allMrs: GitLabMR[] = [
    ...userAssignedMrs,
    ...userReviewingMrs,
    ...groupMrs,
  ];
  const mrs = allMrs.reduce((acc: GitLabMR[], curr) => {
    if (!acc.find(accMr => accMr.id === curr.id)) {
      return [...acc, curr];
    }
    return acc;
  }, []);
  yield put(gitLabActions.setMrs({ mrs }));
  yield call(removeLoader, loaderId);
}

function* getGroupMergeRequests() {
  const url: string = yield select(selectUrl);
  const groupConfigsListeningForMrs: {
    group: GitLabGroup;
    includeWIP: boolean;
  }[] = yield select(selectGroupsListeningForMrs);

  if (!groupConfigsListeningForMrs || groupConfigsListeningForMrs.length <= 0) {
    return [];
  }

  // Get all MRs for listened groups
  let mrs: GitLabMR[] = [];
  for (let groupConfig of groupConfigsListeningForMrs) {
    if (!groupConfig || !groupConfig.group) continue;
    try {
      const groupMrs = yield call(
        Api.getGroupMergeRequests,
        url,
        groupConfig.group.id,
      );
      mrs = [...mrs, ...groupMrs];
    } catch (error) {
      yield call(displayNotification, error);
    }
  }
  return mrs;
}

function* getUserAssignedMrs() {
  const mustLoad = yield select(mustLoadUserAssignedMRs);
  if (!mustLoad) return [];
  const url: string = yield select(selectUrl);

  try {
    const mrsUserAssigned = yield call(Api.getUserAssignedMrs, url);
    return mrsUserAssigned;
  } catch (error) {
    yield call(displayNotification, error);
    return [];
  }
}

function* getMrsWithUserAsReviewer() {
  const mustLoad = yield select(mustLoadMRsUserIsReviewing);
  if (!mustLoad) return [];
  const url: string = yield select(selectUrl);
  const userData: GitLabUserData = yield select(selectUserData);
  if (!userData) return [];

  try {
    const mrs = yield call(Api.getMrsWithReviewer, userData.id, url);
    return mrs;
  } catch (error) {
    yield call(displayNotification, error);
    return [];
  }
}
