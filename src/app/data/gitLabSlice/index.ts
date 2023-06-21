import { PayloadAction } from '@reduxjs/toolkit';
import {
  EventId,
  GitLabEvent,
  GitLabGroup,
  GitLabMR,
  GitLabPipeline,
  GitLabProject,
  GitLabUserData,
  GroupName,
  MrId,
  PipelineId,
  ProjectId,
} from 'app/apis/gitlab/types';
import { createSlice } from 'utils/@reduxjs/toolkit';
import { useInjectReducer, useInjectSaga } from 'utils/redux-injectors';
import { gitLabSaga } from './saga';
import { GitLabState } from './types';
import * as PersistanceAPI from 'app/apis/persistance';
import {
  createSettingReducer,
  equalByAttribute,
  getIdByAttribute,
  remove,
  updateState,
  upsert,
} from '../helper';

export const LOCALSTORAGE_KEY = 'gitlab-state';

const loadInitialState = (): GitLabState => {
  const persistedState: GitLabState =
    PersistanceAPI.loadFromLocalStorage(LOCALSTORAGE_KEY);
  return {
    configured: persistedState?.configured || false,
    url: persistedState?.url,
    token: persistedState?.token,
    userId: persistedState?.userId,
    userData: persistedState?.userData,
    listenedGroups: persistedState?.listenedGroups || [],
    groups: persistedState?.groups || [],
    mrs: persistedState?.mrs || [],
    projects: persistedState?.projects || [],
    events: persistedState?.events || [],
    pipelines: persistedState?.pipelines || [],
    mrsUserAssigned: persistedState?.mrsUserAssigned || [],
    mrsByGroup: persistedState?.mrsByGroup || new Map(),
    projectsByGroup: persistedState?.projectsByGroup || new Map(),
    pipelinesByGroup: persistedState?.pipelinesByGroup || new Map(),
    eventsByProject: persistedState?.eventsByProject || new Map(),
    pipelinesToReload: [],
    jobsToPlay: [],
  };
};

export const initialState = loadInitialState();

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
    reload(state, action: PayloadAction<void>) {},
    deleteConfiguration(state, action: PayloadAction<void>) {
      state = {
        configured: false,
        url: undefined,
        token: undefined,
        userId: undefined,
        userData: undefined,
        listenedGroups: [],
        groups: [],
        mrs: [],
        projects: [],
        events: [],
        pipelines: [],
        mrsUserAssigned: [],
        mrsByGroup: new Map(),
        projectsByGroup: new Map(),
        pipelinesByGroup: new Map(),
        eventsByProject: new Map(),
        pipelinesToReload: [],
        jobsToPlay: [],
      };
    },
    // groups
    setGroups(state, action: PayloadAction<GitLabGroup[]>) {
      if (!checkAllAreObject(action.payload)) return;
      state.groups = action.payload;
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
        equalByAttribute('visId'),
      );
      // clean up state if we changed the listener to a group and that group is no longer listened to
      if (currentListener && !hasListener(state, currentListener.groupName)) {
        // mrs
        state.mrs = remove(
          state.mrs,
          state.mrsByGroup.get(currentListener.groupName) || [],
          equalByAttribute('id'),
        );
        // mrsByGroup
        state.mrsByGroup.delete(currentListener.groupName);
        // projects
        state.projects = remove(
          state.projects,
          state.projectsByGroup.get(currentListener.groupName) || [],
          equalByAttribute('id'),
        );
        // projectsByGroup
        state.projectsByGroup.delete(currentListener.groupName);
        // pipelinesByGroup
        state.pipelinesByGroup.delete(currentListener.groupName);
      }
    },
    removeListenedGroup(
      state,
      action: PayloadAction<{ visId: string; groupName: string }>,
    ) {
      // TODO: Das scheint nicht zu funktionieren
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
          equalByAttribute('id'),
        );
        // mrsByGroup
        state.mrsByGroup.delete(groupName);
        // projects
        state.projects = remove(
          state.projects,
          state.projectsByGroup.get(groupName) || [],
          equalByAttribute('id'),
        );
        // projectsByGroup
        state.projectsByGroup.delete(groupName);
        // pipelinesByGroup
        state.pipelinesByGroup.delete(groupName);
      }
    },
    // mrs
    setMrs(
      state,
      action: PayloadAction<{ mrs: GitLabMR[]; groupName?: GroupName }>,
    ) {
      const { mrs, groupName } = action.payload;
      if (groupName) {
        updateState<GitLabMR, MrId, GroupName>(
          mrs,
          state.mrs,
          groupName,
          state.mrsByGroup,
          getIdByAttribute('id'),
          equalByAttribute('id'),
        );
      } else {
        // If the MRs aren't associated to a group, they must be assigned to the user
        state.mrs = upsert(state.mrs, mrs, equalByAttribute('id'));
        state.mrsUserAssigned = upsert(
          state.mrsUserAssigned,
          mrs.map(getIdByAttribute('id')),
          equalByAttribute('id'),
        );
      }
    },
    // projects
    setProjects: createSettingReducer<GitLabProject, ProjectId, GroupName>(
      'projects',
      'projectsByGroup',
      'id',
    ),
    // events
    setEvents: createSettingReducer<GitLabEvent, EventId, ProjectId>(
      'events',
      'eventsByProject',
      'id',
    ),
    // pipelines
    setPipelines: createSettingReducer<GitLabPipeline, PipelineId, GroupName>(
      'pipelines',
      'pipelinesByGroup',
      'id',
    ),
    updatePipeline(state, action: PayloadAction<{ pipeline: GitLabPipeline }>) {
      const {
        payload: { pipeline },
      } = action;
      // upsert pipeline
      state.pipelines = upsert(
        state.pipelines,
        [pipeline],
        equalByAttribute('id'),
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
  },
});

export const { actions: gitLabActions, reducer } = slice;

export const useGitLabSlice = () => {
  useInjectReducer({ key: slice.name, reducer: slice.reducer });
  useInjectSaga({ key: slice.name, saga: gitLabSaga });
  return { actions: slice.actions };
};
