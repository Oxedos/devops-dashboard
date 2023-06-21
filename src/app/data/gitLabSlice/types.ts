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

/* --- STATE --- */
export interface GitLabState {
  // Config Data
  configured: boolean; // If GitLab DataSource is correctly set up
  url: string | undefined; // baseUrl of API including /api/<version>
  token: string | undefined; // private token to access API
  // Data of current user
  userId: number | undefined;
  userData: GitLabUserData | undefined; // Data returned from GET /user
  // Which data to regularly fetch
  listenedGroups: { visId: string; groupName: string }[];
  // General Data -> main data storage
  groups: GitLabGroup[]; // All groups the user is member of / has access to
  mrs: GitLabMR[]; // all currently loaded MRs
  projects: GitLabProject[]; // All currently loaded projects
  events: GitLabEvent[];
  pipelines: GitLabPipeline[];
  // Data Associations
  mrsUserAssigned: MrId[];
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
