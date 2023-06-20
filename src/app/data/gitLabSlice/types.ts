import {
  GitLabGroup,
  GitLabMR,
  GitLabProject,
  GitLabUserData,
  GitLabPipeline,
  GitLabEvent,
} from 'app/apis/gitlab/types';

/* --- STATE --- */
export interface GitLabState {
  configured: boolean; // If GitLab DataSource is correctly set up
  url: string | undefined; // baseUrl of API including /api/<version>
  token: string | undefined; // private token to access API
  userId: number | undefined;
  userData: GitLabUserData | undefined; // Data returned from GET /user
  groups: GitLabGroup[]; // All groups the user is member of
  mrsByGroup: Map<string, GitLabMR[]>; // MRs stored by their groups full_name
  mrs: GitLabMR[]; // A concatenation of all MRs of all groups the user listens to. No duplicates
  mrsUserAssigned: GitLabMR[]; // All MRs currently assigned to the user (disregarding group listeners)
  projects: GitLabProject[]; // Concatenation of all projects of all groups the user listens to. No duplicates
  projectsByGroup: Map<string, GitLabProject[]>; // Projects per group including subprojects. Key: full_name
  listenedGroups: { visId: string; groupName: string }[];
  pipelinesByGroup: Map<string, GitLabPipeline[]>;
  pipelinesToReload: { projectId: number; groupName: string; ref: string }[]; // Pipelines that will be reloaded
  jobsToPlay: {
    projectId: number;
    jobId: number;
    mrIid: number;
    groupName: string;
  }[];
  events: Map<number, GitLabEvent[]>; // projectId -> GitLabEvent[]
}
