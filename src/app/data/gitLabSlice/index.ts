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
import * as PersistanceAPI from 'app/apis/persistance';
import { createSlice } from 'utils/@reduxjs/toolkit';
import { useInjectReducer, useInjectSaga } from 'utils/redux-injectors';
import {
  createSettingReducer,
  equalByAttribute,
  getIdByAttribute,
  remove,
  removeFromStateByIdentifier,
  updateState,
  upsert,
} from '../helper';
import { selectAbandonedGroups } from './selectors/groupSelectors';
import {
  selectMrsWithUserAsReviewer,
  selectUserAssignedMrs,
} from './selectors/mrSelectors';
import { gitLabSaga } from './saga';
import { GitLabState } from './types';

export const LOCALSTORAGE_KEY = 'gitlab-state';

const loadInitialState = (): GitLabState => {
  const persistedState: GitLabState =
    PersistanceAPI.loadFromLocalStorage(LOCALSTORAGE_KEY);
  return {
    url: persistedState?.url,
    applicationId: persistedState?.applicationId,
    userData: persistedState?.userData,
    groups: persistedState?.groups || [],
    mrs: persistedState?.mrs || [],
    projects: persistedState?.projects || [],
    events: persistedState?.events || [],
    pipelines: persistedState?.pipelines || [],
    mrsByGroup: persistedState?.mrsByGroup || new Map(),
    projectsByGroup: persistedState?.projectsByGroup || new Map(),
    pipelinesByGroup: persistedState?.pipelinesByGroup || new Map(),
    eventsByProject: persistedState?.eventsByProject || new Map(),
    pipelinesToReload: [],
    jobsToPlay: [],
  };
};

export const initialState = loadInitialState();

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

function clearStateByGroupName(state, groupName) {
  state.mrs = removeFromStateByIdentifier<GitLabMR, MrId, GroupName>(
    state.mrs,
    state.mrsByGroup,
    groupName,
    mr => mr && mr.id,
    mr => {
      // except user assigned MRs
      if (!mr || !mr.assignee || !state.userData || !state.userData.id) {
        return false;
      }
      return mr.assignee.id === state.userData.id;
    },
  );

  // This needs to happen before we clean up the projects
  if (state.projectsByGroup.has(groupName)) {
    const projectIds = state.projectsByGroup.get(groupName);
    if (projectIds && projectIds.length > 0) {
      for (const projectId of projectIds) {
        state.events = removeFromStateByIdentifier<
          GitLabEvent,
          EventId,
          ProjectId
        >(state.events, state.eventsByProject, projectId, event => event.id);
      }
    }
  }

  state.projects = removeFromStateByIdentifier<
    GitLabProject,
    ProjectId,
    GroupName
  >(state.projects, state.projectsByGroup, groupName, project => project.id);

  state.pipelines = removeFromStateByIdentifier<
    GitLabPipeline,
    PipelineId,
    GroupName
  >(
    state.pipelines,
    state.pipelinesByGroup,
    groupName,
    pipeline => pipeline.id,
  );
}

const slice = createSlice({
  name: 'gitLab',
  initialState,
  reducers: {
    setUrl(state, action: PayloadAction<string | undefined>) {
      state.url = action.payload;
    },
    setUserData(state, action: PayloadAction<GitLabUserData>) {
      state.userData = action.payload;
    },
    setApplicationId(state, action: PayloadAction<string>) {
      state.applicationId = action.payload;
    },
    reload(state, action: PayloadAction<void>) {},
    deleteConfiguration(state, action: PayloadAction<void>) {
      return {
        url: undefined,
        applicationId: undefined,
        userData: undefined,
        listenedGroups: [],
        groups: [],
        mrs: [],
        projects: [],
        events: [],
        pipelines: [],
        mrsByGroup: new Map(),
        projectsByGroup: new Map(),
        pipelinesByGroup: new Map(),
        eventsByProject: new Map(),
        pipelinesToReload: [],
        jobsToPlay: [],
      };
    },
    addGitlabVisualisation(state, action: PayloadAction<void>) {},
    cleanState(state, action: PayloadAction<void>) {
      selectAbandonedGroups({ gitLab: state }).forEach(abandonedGroup =>
        clearStateByGroupName(state, abandonedGroup),
      );
    },
    // groups
    setGroups(state, action: PayloadAction<GitLabGroup[]>) {
      if (!checkAllAreObject(action.payload)) return;
      state.groups = action.payload;
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
        // or are being reviewed by the user
        // 1: Delete all MRs that were previously assigned
        const previousUserAssignedMRs = selectUserAssignedMrs({
          gitLab: state,
        });
        const previousReviewingMRs = selectMrsWithUserAsReviewer({
          gitLab: state,
        });
        const mrsLeftInState = remove(
          state.mrs,
          previousUserAssignedMRs.concat(previousReviewingMRs),
          (a, b) => a.id === b.id,
        );
        // Now re-add all user assigned MRs
        // If a MR changed assignees but wasn't closed, it will now be deleted
        // -> okay for now, next reload will bring that MR back
        const newStateMRs = upsert(mrsLeftInState, mrs, equalByAttribute('id'));
        state.mrs = newStateMRs;
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
