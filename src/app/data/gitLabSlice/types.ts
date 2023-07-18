import {
  GitLabEvent,
  GitLabGroup,
  GitLabIssue,
  GitLabMR,
  GitLabPipeline,
  GitLabProject,
  GitLabUserData,
  GroupName,
  ProjectId,
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
  // GitLab Data
  userData: GitLabUserData | undefined; // Data returned from GET /user
  groups: GitLabGroup[]; // All groups the user is member of / has access to
  mrs: GitLabMR[]; // all currently loaded MRs
  projects: GitLabProject[]; // All currently loaded projects
  events: GitLabEvent[];
  pipelines: GitLabPipeline[];
  issues: GitLabIssue[];
  // Temporary Data for GitLab Actions and such
  pipelinesToReload: {
    projectId: ProjectId;
    groupName: GroupName;
    ref: string;
  }[]; // Pipelines that will be reloaded
}
