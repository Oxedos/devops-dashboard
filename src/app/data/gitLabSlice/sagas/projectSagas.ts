import { globalActions } from 'app/data/globalSlice';
import { call, fork, join, put, select } from 'redux-saga/effects';
import { gitLabActions as actions, gitLabActions } from '..';
import { selectUrl } from '../selectors/selectors';
import {
  selectGroupByGroupName,
  selectListenedGroups,
} from '../selectors/groupSelectors';
import { GitLabProject } from 'app/apis/gitlab/types';
import { getProject, getProjectsForGroup } from 'app/apis/gitlab';
import { selectAllMrs } from '../selectors/mrSelectors';
import { selectProjects } from '../selectors/projectSelectors';

export function* loadProjects() {
  const url: string = yield select(selectUrl);
  const listenedGroups: string[] = yield select(selectListenedGroups);

  if (listenedGroups.length <= 0) return;

  const loadingId = '[GitLab] getProjects';
  yield put(globalActions.addLoader({ id: loadingId }));

  const tasks: any[] = [];
  for (let groupName of listenedGroups) {
    const task = yield fork(loadProjectsForGroup, groupName, url);
    tasks.push(task);
  }
  yield join(tasks); // wait for all tasks to finish
  yield put(globalActions.removeLoader({ id: loadingId }));
}

export function* loadMissingProjects() {
  const url: string = yield select(selectUrl);
  const loadingId = '[GitLab] getMissingProjects';

  // Check for MRs where there's no project loaded for
  const mrs = yield select(selectAllMrs);
  const projects: GitLabProject[] = yield select(selectProjects);
  const unloadedProjectIds = mrs
    .filter(mr => !projects.find(project => project.id === mr.project_id))
    .map(mr => mr.project_id);

  if (!unloadedProjectIds || unloadedProjectIds.length <= 0) return;

  try {
    yield put(globalActions.addLoader({ id: loadingId }));
    const newProjects: GitLabProject[] = [];
    for (let projectId of unloadedProjectIds) {
      if (!projectId) continue;
      const project: GitLabProject = yield call(getProject, url, projectId);
      newProjects.push(project);
    }
    yield put(
      gitLabActions.setProjects({
        items: newProjects,
        assoicatedId: '[No Listened Group]',
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
  } finally {
    yield put(globalActions.removeLoader({ id: loadingId }));
  }
}

function* loadProjectsForGroup(groupName: string, url: string) {
  const group = yield select(state =>
    selectGroupByGroupName(state, { groupName }),
  );
  if (!group) return;
  try {
    const projects: GitLabProject[] = yield call(
      getProjectsForGroup,
      url,
      group.id,
      {
        include_subgroups: true,
        with_shared: false,
      },
    );
    yield put(
      actions.setProjects({ items: projects, assoicatedId: groupName }),
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
