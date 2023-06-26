import {
  GitLabGroup,
  GitLabMR,
  GitLabProject,
  GitLabUserData,
  GitLabEvent,
  GroupName,
  MrId,
  ProjectId,
  PipelineId,
  JobId,
  GitLabPipeline,
  EventId,
} from 'app/apis/gitlab/types';

export type PkceValues = {
  state: string;
  codeChallenge: string | undefined;
  codeVerifier: string;
};

export type OAuthToken = {
  authoriationToken: string;
  refreshToken: string;
  expiresIn: number;
  createdAt: number;
  tokenType: string;
};

/* --- STATE --- */
export interface GitLabState {
  // Config Data
  url: string | undefined; // baseUrl of API including /api/<version>
  applicationId: string | undefined;
  // Data of current user
  userData: GitLabUserData | undefined; // Data returned from GET /user
  // General Data -> main data storage
  groups: GitLabGroup[]; // All groups the user is member of / has access to
  mrs: GitLabMR[]; // all currently loaded MRs
  projects: GitLabProject[]; // All currently loaded projects
  events: GitLabEvent[];
  pipelines: GitLabPipeline[];
  // Data Associations
  mrsByGroup: Map<GroupName, MrId[]>;
  projectsByGroup: Map<GroupName, ProjectId[]>;
  pipelinesByGroup: Map<GroupName, PipelineId[]>;
  eventsByProject: Map<ProjectId, EventId[]>;
  // Temporary Data for GitLab Actions and such
  pipelinesToReload: {
    projectId: ProjectId;
    groupName: GroupName;
    ref: string;
  }[]; // Pipelines that will be reloaded
  jobsToPlay: {
    projectId: ProjectId;
    jobId: JobId;
    mrIid: number;
    groupName: GroupName;
  }[];
}
