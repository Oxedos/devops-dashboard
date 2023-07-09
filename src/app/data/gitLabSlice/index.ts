import { PayloadAction } from '@reduxjs/toolkit';
import {
  GitLabEvent,
  GitLabGroup,
  GitLabIssue,
  GitLabMR,
  GitLabPipeline,
  GitLabProject,
  GitLabUserData,
} from 'app/apis/gitlab/types';
import { createSlice } from 'utils/@reduxjs/toolkit';
import { equalByAttribute, upsert } from '../helper';
import { gitLabSaga } from './sagas';
import { GitLabState } from './types';

export const LOCALSTORAGE_KEY = 'gitlab-state';

export const initialState: GitLabState = {
  url: undefined,
  applicationId: undefined,
  userData: undefined,
  groups: [],
  mrs: [],
  projects: [],
  events: [],
  pipelines: [],
  issues: [],
  pipelinesToReload: [],
  jobsToPlay: [],
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
    setFullState(state, action: PayloadAction<{ state: GitLabState }>) {
      if (!action.payload.state) {
        return;
      }
      state.url = action.payload.state.url;
      state.applicationId = action.payload.state.applicationId;
      state.userData = action.payload.state.userData;
      state.groups = action.payload.state.groups;
      state.mrs = action.payload.state.mrs;
      state.projects = action.payload.state.projects;
      state.events = action.payload.state.events;
      state.pipelines = action.payload.state.pipelines;
      state.issues = action.payload.state.issues;
    },
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
        issues: [],
        pipelinesToReload: [],
        jobsToPlay: [],
      };
    },
    addGitlabVisualisation(state, action: PayloadAction<void>) {},
    // groups
    setGroups(state, action: PayloadAction<GitLabGroup[]>) {
      if (!checkAllAreObject(action.payload)) return;
      state.groups = action.payload;
    },
    setMrs(state, action: PayloadAction<{ mrs: GitLabMR[] }>) {
      state.mrs = [...action.payload.mrs];
    },
    setProjects(state, action: PayloadAction<{ projects: GitLabProject[] }>) {
      state.projects = [...action.payload.projects];
    },
    setEvents(state, action: PayloadAction<{ events: GitLabEvent[] }>) {
      state.events = [...action.payload.events];
    },
    setPipelines(
      state,
      action: PayloadAction<{ pipelines: GitLabPipeline[] }>,
    ) {
      state.pipelines = [...action.payload.pipelines];
    },
    setIssues(state, action: PayloadAction<{ issues: GitLabIssue[] }>) {
      state.issues = [...action.payload.issues];
    },
    upsertIssue(state, action: PayloadAction<{ issue: GitLabIssue }>) {
      const {
        payload: { issue },
      } = action;
      // Manually merge issue labels -> after updating an issue we do not receive label details (no colors etc)
      const newLabels = issue.labels;
      const oldIssue = state.issues.find(i => i.id === issue.id);
      if (!oldIssue) {
        // just insert and be done
        state.issues = [...state.issues, issue];
        return;
      }
      const oldLabels = oldIssue.labels;
      // check if we have work to do
      if (
        (!newLabels && !oldLabels) ||
        (newLabels.length <= 0 && oldLabels.length <= 0)
      ) {
        state.issues = upsert(state.issues, [issue], equalByAttribute('id'));
        return;
      }
      const mergedLabels = newLabels.map(newLabel => {
        const newLabelName =
          typeof newLabel === 'string' ? newLabel : newLabel.name;
        const oldLabel = oldLabels.find(l =>
          typeof l === 'string' ? newLabelName === l : newLabelName === l.name,
        );
        if (!oldLabel) return newLabel;
        if (typeof oldLabel === 'string') return newLabel;
        return oldLabel;
      });
      state.issues = upsert(
        state.issues,
        [{ ...issue, labels: mergedLabels }],
        equalByAttribute('id'),
      );
    },
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

export const name = slice.name;
export const { actions, reducer } = slice;
export const saga = gitLabSaga;
