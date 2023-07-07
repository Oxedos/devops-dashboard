import { gitLabActions } from 'app';
import { getProjectIssues } from 'app/apis/gitlab';
import { GitLabIssue, ProjectId } from 'app/apis/gitlab/types';
import { call, put, select } from 'redux-saga/effects';
import { selectProjectIdsListeningForIssues } from '../selectors/issueSelectors';
import { selectUrl } from '../selectors/selectors';
import { displayNotification, removeLoader, setLoader } from './sagaHelper';
import moment from 'moment';

export function* loadIssues() {
  const loaderId = yield call(setLoader, 'Issues');
  const issues = yield call(getIssuesForProjects);
  yield put(gitLabActions.setIssues({ issues }));
  yield call(removeLoader, loaderId);
}

function* getIssuesForProjects() {
  const url: string = yield select(selectUrl);
  const listenedProjectIds: ProjectId[] = yield select(
    selectProjectIdsListeningForIssues,
  );
  if (!listenedProjectIds || listenedProjectIds.length <= 0) return [];

  let issues: GitLabIssue[] = [];
  for (const projectId of listenedProjectIds) {
    if (!projectId) continue;
    try {
      const projectIssues = yield call(
        getProjectIssues,
        projectId,
        moment().startOf('day').toString(),
        url,
      );
      issues = [...issues, ...projectIssues];
    } catch (error) {
      yield call(displayNotification, error);
    }
  }
  return issues;
}
