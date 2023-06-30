import { getProject, getProjectsForGroup } from 'app/apis/gitlab';
import { GitLabProject } from 'app/apis/gitlab/types';
import { call, fork, join, put, select } from 'redux-saga/effects';
import { gitLabActions as actions, gitLabActions } from '..';
import {
  selectGroupByGroupName,
  selectListenedGroups,
} from '../selectors/groupSelectors';
import { selectAllMrs } from '../selectors/mrSelectors';
import { selectProjects } from '../selectors/projectSelectors';
import { selectUrl } from '../selectors/selectors';
import { displayNotification, removeLoader, setLoader } from './sagaHelper';

export function* loadProjects() {
  const loaderId = yield call(setLoader, 'Projects');
  yield call(loadGroupProjects);
  yield call(removeLoader, loaderId);
}

function* loadGroupProjects() {
  const url: string = yield select(selectUrl);
  const listenedGroups: string[] = yield select(selectListenedGroups);
  if (listenedGroups.length <= 0) return;

  const tasks: any[] = [];
  for (let groupName of listenedGroups) {
    const task = yield fork(loadProjectsForGroup, groupName, url);
    tasks.push(task);
  }
  // wait for all tasks to finish
  yield join(tasks);
}

export function* loadMissingProjects() {
  const url: string = yield select(selectUrl);

  // Check for MRs where there's no project loaded for
  const mrs = yield select(selectAllMrs);
  const projects: GitLabProject[] = yield select(selectProjects);
  const unloadedProjectIds = mrs
    .filter(mr => !projects.find(project => project.id === mr.project_id))
    .map(mr => mr.project_id);

  if (!unloadedProjectIds || unloadedProjectIds.length <= 0) return;

  const loaderId = yield call(setLoader, 'Missing Projects');
  try {
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
    yield call(displayNotification, error);
  } finally {
    yield call(removeLoader, loaderId);
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
    yield call(displayNotification, error);
  }
}
