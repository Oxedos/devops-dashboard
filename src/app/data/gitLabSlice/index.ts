import { PayloadAction } from '@reduxjs/toolkit';
import {
  GitLabGroup,
  GitLabIssueStatistics,
  GitLabMR,
  GitLabPipeline,
  GitLabProject,
  GitLabUserData,
} from 'app/apis/gitlab/types';
import { createSlice } from 'utils/@reduxjs/toolkit';
import { useInjectReducer, useInjectSaga } from 'utils/redux-injectors';
import { gitLabSaga } from './saga';
import { GitLabState } from './types';
import * as PersistanceAPI from 'app/apis/persistance';
import { remove, upsert } from '../helper';

export const LOCALSTORAGE_KEY = 'gitlab-state';

const loadInitialState = (): GitLabState => {
  const persistedState: GitLabState =
    PersistanceAPI.loadFromLocalStorage(LOCALSTORAGE_KEY);
  return {
    configured: persistedState?.configured || false,
    url: persistedState?.url,
    token: persistedState?.token,
    userData: persistedState?.userData,
    userId: persistedState?.userId,
    groups: persistedState?.groups || [],
    mrsByGroup: persistedState?.mrsByGroup || new Map(),
    mrs: persistedState?.mrs || [],
    mrsUserAssigned: persistedState?.mrsUserAssigned || [],
    projects: persistedState?.projects || [],
    projectsByGroup: persistedState?.projectsByGroup || new Map(),
    issueStatisticsAll: persistedState?.issueStatisticsAll,
    issueStatisticsByGroup: persistedState?.issueStatisticsByGroup || new Map(),
    listenedGroups: persistedState?.listenedGroups || [],
    pipelinesByGroup: persistedState?.pipelinesByGroup || new Map(),
    pipelinesToReload: [],
    jobsToPlay: [],
  };
};

export const initialState = loadInitialState();

const isEqualbyId = (arg1: { id: number }, arg2: { id: number }) => {
  return arg1.id === arg2.id;
};

const isEqualbyVisId = (arg1: { visId: number }, arg2: { visId: number }) => {
  return arg1.visId === arg2.visId;
};

const isEqualPipeline = (arg1: GitLabPipeline, arg2: GitLabPipeline) => {
  return arg1.project_id === arg2.project_id && arg1.ref === arg2.ref;
};

// returns a list of distinct groups that are listened to
export const uniqueGroupListeners = (state: GitLabState): string[] => {
  const initList: string[] = [];
  if (!state.listenedGroups || state.listenedGroups.length <= 0) {
    return [];
  }
  return state.listenedGroups
    .map(listener => listener.groupName)
    .reduce(
      (unique, item) => (unique.includes(item) ? unique : [...unique, item]),
      initList,
    );
};

const hasListener = (state: GitLabState, groupName: string): boolean => {
  const uniqueGroups = uniqueGroupListeners(state);
  return uniqueGroups.includes(groupName);
};
// Dirty Hack cause something is wrong with the GitLab API on Chrome when receiving an empty array...
function checkAllAreObject(objs: any[]) {
  if (!objs) return false;
  if (!Array.isArray(objs)) return false;
  if (objs.length <= 0) return false;
  for (let obj of objs) {
    if (!(obj instanceof Object)) return false;
  }
  return true;
}

const slice = createSlice({
  name: 'gitLab',
  initialState,
  reducers: {
    setConfigured(state, action: PayloadAction<boolean>) {
      state.configured = action.payload;
    },
    setUrl(state, action: PayloadAction<string | undefined>) {
      state.url = action.payload;
    },
    setToken(state, action: PayloadAction<string | undefined>) {
      state.token = action.payload;
    },
    setUserId(state, action: PayloadAction<number | undefined>) {
      state.userId = action.payload;
    },
    setUserData(state, action: PayloadAction<GitLabUserData>) {
      state.userData = action.payload;
    },
    setGroups(state, action: PayloadAction<GitLabGroup[]>) {
      if (!checkAllAreObject(action.payload)) return;
      state.groups = action.payload;
    },
    setMrs(
      state,
      action: PayloadAction<{ groupName: string; mrs: GitLabMR[] }>,
    ) {
      const {
        payload: { groupName, mrs: newMrs },
      } = action;
      if (!checkAllAreObject(newMrs)) {
        const oldGroupMrs = state.mrsByGroup.get(groupName) || [];
        state.mrs = remove(state.mrs, oldGroupMrs, isEqualbyId);
        state.mrsByGroup.set(groupName, []);
        return;
      }
      state.mrsByGroup.set(groupName, newMrs);
      state.mrs = upsert(state.mrs, newMrs, isEqualbyId);
    },
    setMrsUserAssigned(state, action: PayloadAction<GitLabMR[]>) {
      if (!checkAllAreObject(action.payload)) {
        state.mrsUserAssigned = [];
        return;
      }
      state.mrsUserAssigned = action.payload;
    },
    setProjects(
      state,
      action: PayloadAction<{ groupName: string; projects: GitLabProject[] }>,
    ) {
      const {
        payload: { groupName, projects: newProjects },
      } = action;
      if (!checkAllAreObject(newProjects)) {
        return;
      }
      state.projectsByGroup.set(groupName, newProjects);
      state.projects = upsert(state.projects, newProjects, isEqualbyId);
    },
    setIssuesStatisticForGroup(
      state,
      action: PayloadAction<{
        groupName: string;
        stats: GitLabIssueStatistics;
      }>,
    ) {
      const {
        payload: { groupName, stats },
      } = action;
      state.issueStatisticsByGroup.set(groupName, stats);
    },
    setIssuesStatisticForAll(
      state,
      action: PayloadAction<GitLabIssueStatistics>,
    ) {
      state.issueStatisticsAll = action.payload;
    },
    addListenedGroup(
      state,
      action: PayloadAction<{ visId: string; groupName: string }>,
    ) {
      const {
        payload: { visId },
      } = action;
      // Find current listener -> we need to check if changes occured
      const currentListener = state.listenedGroups.find(
        listener => listener.visId === visId,
      );
      // Save or update the listener in our state
      state.listenedGroups = upsert(
        state.listenedGroups,
        [action.payload],
        isEqualbyVisId,
      );
      // clean up state if we changed the listener to a group and that group is no longer listened to
      if (currentListener && !hasListener(state, currentListener.groupName)) {
        state.pipelinesByGroup.delete(currentListener.groupName);
      }
    },
    removeListenedGroup(
      state,
      action: PayloadAction<{ visId: string; groupName: string }>,
    ) {
      const {
        payload: { visId, groupName },
      } = action;

      // remove this specific listener from our state
      state.listenedGroups = state.listenedGroups.filter(
        listener => listener.visId !== visId,
      );

      // if we do not have any listeners left, remove the data
      if (!hasListener(state, groupName)) {
        // mrs
        state.mrs = remove(
          state.mrs,
          state.mrsByGroup.get(groupName) || [],
          isEqualbyId,
        );
        // mrsByGroup
        state.mrsByGroup.delete(groupName);
        // projects
        state.projects = remove(
          state.projects,
          state.projectsByGroup.get(groupName) || [],
          isEqualbyId,
        );
        // projectsByGroup
        state.projectsByGroup.delete(groupName);
        // issueStatisticsByGroup
        state.issueStatisticsByGroup.delete(groupName);
        // pipelinesByGroup
        state.pipelinesByGroup.delete(groupName);
      }
    },
    setPipelines(
      state,
      action: PayloadAction<{ groupName: string; pipelines: GitLabPipeline[] }>,
    ) {
      const {
        payload: { groupName, pipelines },
      } = action;
      if (!checkAllAreObject(action.payload.pipelines)) {
        state.pipelinesByGroup.set(groupName, []);
        return;
      }
      state.pipelinesByGroup.set(groupName, pipelines);
    },
    updatePipeline(
      state,
      action: PayloadAction<{ groupName: string; pipeline: GitLabPipeline }>,
    ) {
      const {
        payload: { groupName, pipeline },
      } = action;
      const pipelinesByGroup = state.pipelinesByGroup.get(groupName);
      if (!pipelinesByGroup) return;
      state.pipelinesByGroup.set(
        groupName,
        upsert(pipelinesByGroup, [pipeline], isEqualPipeline),
      );
    },
    reloadPipeline(
      state,
      action: PayloadAction<{
        groupName: string;
        projectId: number;
        ref: string;
      }>,
    ) {
      const {
        payload: { projectId, groupName, ref },
      } = action;
      // make sure that we don't add the same pipeline again
      const newList = state.pipelinesToReload.filter(
        o =>
          o.projectId !== projectId &&
          o.groupName !== groupName &&
          o.ref !== ref,
      );
      newList.push({ groupName, projectId, ref });
      state.pipelinesToReload = newList;
    },
    removePipelineToReload(
      state,
      action: PayloadAction<{
        groupName: string;
        projectId: number;
        ref: string;
      }>,
    ) {
      const {
        payload: { projectId, groupName, ref },
      } = action;
      const newList = state.pipelinesToReload.filter(
        o =>
          o.projectId !== projectId &&
          o.groupName !== groupName &&
          o.ref !== ref,
      );
      state.pipelinesToReload = newList;
    },
    playJob(
      state,
      action: PayloadAction<{
        groupName: string;
        projectId: number;
        jobId: number;
        mrIid: number;
      }>,
    ) {
      const {
        payload: { projectId, groupName, mrIid, jobId },
      } = action;
      // make sure that we don't add the same pipeline again
      const newList = state.jobsToPlay.filter(
        o =>
          o.projectId !== projectId &&
          o.jobId !== jobId &&
          o.mrIid !== mrIid &&
          o.groupName !== groupName,
      );
      newList.push({ groupName, projectId, jobId, mrIid });
      state.jobsToPlay = newList;
    },
    removeJobToPlay(
      state,
      action: PayloadAction<{
        projectId: number;
        jobId: number;
        mrIid: number;
        groupName: string;
      }>,
    ) {
      const {
        payload: { projectId, jobId, mrIid, groupName },
      } = action;
      const newList = state.jobsToPlay.filter(
        o =>
          o.projectId !== projectId &&
          o.jobId !== jobId &&
          o.mrIid !== mrIid &&
          o.groupName !== groupName,
      );
      state.jobsToPlay = newList;
    },
    reload(state, action: PayloadAction<void>) {},
    deleteConfiguration(state, action: PayloadAction<void>) {
      return {
        configured: false,
        url: undefined,
        token: undefined,
        userData: undefined,
        userId: undefined,
        groups: [],
        mrsByGroup: new Map(),
        mrs: [],
        mrsUserAssigned: [],
        projects: [],
        projectsByGroup: new Map(),
        issueStatisticsAll: undefined,
        issueStatisticsByGroup: new Map(),
        listenedGroups: [],
        listenedGroupsForPipelines: [],
        pipelinesByGroup: new Map(),
        pipelinesToReload: [],
        jobsToPlay: [],
      };
    },
  },
});

export const { actions: gitLabActions, reducer } = slice;

export const useGitLabSlice = () => {
  useInjectReducer({ key: slice.name, reducer: slice.reducer });
  useInjectSaga({ key: slice.name, saga: gitLabSaga });
  return { actions: slice.actions };
};
