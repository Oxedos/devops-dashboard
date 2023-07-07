import { gitLabActions } from 'app';
import * as Api from 'app/apis/gitlab';
import { GitLabProject } from 'app/apis/gitlab/types';
import { call, put, select } from 'redux-saga/effects';
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
  const memberProjects = yield call(getProjectsWithMembership);
  const groupProjects = yield call(loadGroupProjects);
  const missingProjects = yield call(getMissingProjects);
  const allProjects = [...memberProjects, ...groupProjects, ...missingProjects];
  const projects = allProjects
    .reduce((acc: GitLabProject[], curr) => {
      if (!acc.find(accMr => accMr.id === curr.id)) {
        return [...acc, curr];
      }
      return acc;
    }, [])
    .sort((a, b) => a.name_with_namespace.localeCompare(b.name_with_namespace));
  yield put(gitLabActions.setProjects({ projects }));
  yield call(removeLoader, loaderId);
}

function* loadGroupProjects() {
  const url: string = yield select(selectUrl);
  const listenedGroups: string[] = yield select(selectListenedGroups);
  if (listenedGroups.length <= 0) return [];

  let projects: GitLabProject[] = [];
  for (let groupName of listenedGroups) {
    const groupProjects = yield call(getProjectsForGroup, groupName, url);
    projects = [...projects, ...groupProjects];
  }
  return projects;
}

function* getMissingProjects() {
  const url: string = yield select(selectUrl);

  // Check for MRs where there's no project loaded for
  const mrs = yield select(selectAllMrs);
  const projects: GitLabProject[] = yield select(selectProjects);
  const unloadedProjectIds = mrs
    .filter(mr => !projects.find(project => project.id === mr.project_id))
    .map(mr => mr.project_id);

  if (!unloadedProjectIds || unloadedProjectIds.length <= 0) return [];
  const newProjects: GitLabProject[] = [];
  for (let projectId of unloadedProjectIds) {
    if (!projectId) continue;
    try {
      const project: GitLabProject = yield call(Api.getProject, url, projectId);
      newProjects.push(project);
    } catch (error) {
      yield call(displayNotification, error);
    }
  }
  return newProjects;
}

function* getProjectsForGroup(groupName: string, url: string) {
  const group = yield select(state =>
    selectGroupByGroupName(state, { groupName }),
  );
  if (!group) return [];
  try {
    const projects: GitLabProject[] = yield call(
      Api.getProjectsForGroup,
      url,
      group.id,
      {
        include_subgroups: true,
        with_shared: false,
      },
    );
    return projects;
  } catch (error) {
    yield call(displayNotification, error);
    return [];
  }
}

function* getProjectsWithMembership() {
  const url: string = yield select(selectUrl);
  try {
    return yield call(Api.getProjectsWithMembership, url);
  } catch (error) {
    yield call(displayNotification, error);
    return [];
  }
}
