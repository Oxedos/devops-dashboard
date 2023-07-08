import { gitLabActions } from 'app';
import { getProjectIssues } from 'app/apis/gitlab';
import { GitLabIssue, GitLabProject } from 'app/apis/gitlab/types';
import moment from 'moment';
import { call, put, select } from 'redux-saga/effects';
import { selectProjectsListeningForIssues } from '../selectors/issueSelectors';
import { selectUrl } from '../selectors/selectors';
import { displayNotification, removeLoader, setLoader } from './sagaHelper';

export function* loadIssues() {
  const loaderId = yield call(setLoader, 'Issues');
  const issues = yield call(getIssuesForProjects);
  yield put(gitLabActions.setIssues({ issues }));
  yield call(removeLoader, loaderId);
}

function* getIssuesForProjects() {
  const url: string = yield select(selectUrl);
  const listenedProjects: GitLabProject[] = yield select(
    selectProjectsListeningForIssues,
  );
  if (!listenedProjects || listenedProjects.length <= 0) return [];

  let issues: GitLabIssue[] = [];
  for (const project of listenedProjects) {
    if (!project) continue;
    try {
      const projectIssues = yield call(
        getProjectIssues,
        project.id,
        moment().startOf('day').toString(),
        project.path_with_namespace,
        url,
      );
      issues = [...issues, ...projectIssues];
    } catch (error) {
      yield call(displayNotification, error);
    }
  }
  return issues;
}
