export type MrId = number;
export type GroupName = string;
export type GroupId = number;
export type ProjectId = number;
export type UserId = number;
export type JobId = number;
export type PipelineId = number;
export type MilestoneId = number;
export type EventId = number;
export type IssueId = number;

export type GitLabGroup = {
  id: GroupId;
  name: string;
  path: string;
  full_name: string;
  full_path: string;
  description: string;
  avatar_url: string;
  parent_id: number;
  web_url: string;
};

export type GitLabUserData = {
  id: UserId;
  username: string;
  name: string;
  email: string;
  avatar_url: string;
};

export type GitLabUserReference = {
  id: UserId;
  name: string;
  username: string;
  avatar_url: string;
  web_url: string;
};

export type GitLabProject = {
  id: ProjectId;
  description: string;
  default_branch: string;
  ssh_url_to_repo: string;
  http_url_to_repo: string;
  web_url: string;
  readme_url: string;
  tag_list: string[];
  name: string;
  name_with_namespace: string;
  path: string;
  path_with_namespace: string;
  created_at: string;
  last_activity_at: string;
  forks_count: number;
  avatar_url: string;
  star_count: number;
  archived: boolean;
  jobs_enabled: boolean;
  mrs: GitLabMR[];
};

export type GitLabJob = {
  commit: {
    author_email: string;
    author_name: string;
    created_at: string;
    id: string;
    message: string;
    short_id: string;
    title: string;
  };
  created_at: string;
  started_at: string;
  finished_at: string;
  duration: number;
  tag_list: string[];
  id: JobId;
  name: string;
  pipeline: {
    id: PipelineId;
  };
  ref: string;
  stage: string;
  status: string;
  web_url: string;
  user: GitLabUserReference;
  allow_failure: boolean;
};

export type GitLabPipelineBasic = {
  id: PipelineId;
  project_id: ProjectId;
  status: string;
  ref: string;
  sha: string;
  web_url: string;
  created_at: string;
  updated_at: string;
};

export type GitLabPipeline = {
  // Non Gitlab attribues
  jobs?: GitLabJob[];
  title: string | undefined; // Title of associated MR if present
  mr_web_url: string | undefined; // Web URL of associated MR if present
  labels: GitlabLabelDetail[];
  associatedMr: GitLabMR;
} & GitLabPipelineBasic;

export type GitlabLabelDetail = {
  name: string;
  color: string;
  description: string;
  description_html: string;
  text_color: string;
};

export type GitLabMR = {
  id: MrId;
  iid: number;
  project_id: number;
  title: string;
  description: string;
  state: string;
  merge_user: GitLabUserReference;
  merged_at: string;
  prepared_at: string;
  closed_by: string;
  closed_at: string;
  created_at: string;
  updated_at: string;
  target_branch: string;
  source_branch: string;
  upvotes: number;
  downvotes: number;
  author: GitLabUserReference;
  assignee: GitLabUserReference;
  assignees: GitLabUserReference[];
  reviewers: GitLabUserReference[];
  source_project_id: number;
  target_project_id: number;
  labels: GitlabLabelDetail[];
  draft: boolean;
  work_in_progress: boolean;
  milestone: {
    id: number;
    iid: number;
    project_id: number;
    title: string;
    description: string;
    state: string;
    created_at: string;
    updated_at: string;
    due_date: string;
    start_date: string;
    web_url: string;
  };
  merge_when_pipeline_succeeds: boolean;
  merge_status: string;
  detailed_merge_status: string;
  sha: string;
  merge_commit_sha: string;
  squash_commit_sha: string;
  user_notes_count: number;
  discussion_locked: string;
  should_remove_source_branch: boolean;
  force_remove_source_branch: boolean;
  allow_collaboration: boolean;
  allow_maintainer_to_push: boolean;
  web_url: string;
  references: {
    short: string;
    relative: string;
    full: string;
  };
  time_stats: {
    time_estimate: number;
    total_time_spent: number;
    human_time_estimate: string;
    human_total_time_spent: string;
  };
  squash: boolean;
  task_completion_status: {
    count: number;
    completed_count: number;
  };
  has_conflicts: boolean;
  blocking_discussions_resolved: boolean;
  // Added by me
  approvalState?: GitlabMrApprovalState;
};

export type GitLabMrExtended = {
  head_pipeline: GitLabPipelineBasic;
} & GitLabMR;

export type GitLabMilestone = {
  id: MilestoneId;
  iid: number;
  project_id: number;
  title: string;
  description: string;
  state: string;
  created_at: string;
  updated_at: string;
  due_date: string;
  start_date: string;
  web_url: string;
};

export type GitLabEvent = {
  id: EventId;
  title: null;
  project_id: number;
  action_name: string;
  target_id: number;
  target_iid: number;
  target_type: GitLabEventTargetType | string;
  author_id: number;
  target_title: string;
  created_at: string;
  author: GitLabUserReference;
  author_username: string;
  push_data?: {
    commit_count: number;
    action: string;
    ref_type: string;
    commit_from: string;
    commit_to: string;
    ref: string;
    commit_title?: string;
    ref_count: number;
  };
  note?: {
    attachment: any;
    author: GitLabUserReference;
    body: string;
    commands_changes: object;
    confidential: boolean;
    created_at: string;
    id: number;
    internal: boolean;
    noteable_id: number;
    noteable_iid: number;
    noteable_type: string;
    project_id: number;
    resolvable: boolean;
    system: boolean;
    type: any;
    updated_at: string;
    position?: {
      base_sha: string;
      start_sha: string;
      head_sha: string;
      old_path: string;
      new_path: string;
      position_type: string;
      old_line?: number;
      new_line?: number;
      line_range: any;
    };
  };
  // Added types
  project: GitLabProject | undefined;
};

export enum GitLabEventTargetType {
  issue = 'issue',
  milestone = 'milestone',
  merge_request = 'merge_request',
  note = 'note',
  project = 'project',
  snippet = 'snippet',
  user = 'user',
}

export enum GitLabIssueType {
  issue = 'issue',
  incident = 'incident',
  testCase = 'test_case',
}

export enum GitLabIssueState {
  opened = 'opened',
  closed = 'closed',
}

export type GitLabTimeStats = {
  time_estimate: number;
  total_time_spent: number;
  human_time_estimate: any;
  human_total_time_spent: any;
};

type GitLabIssueExtraAttributes = {
  renderedDescription?: string;
};

export type GitLabIssue = {
  id: IssueId;
  project_id: ProjectId;
  iid: number;
  milestone: GitLabMilestone;
  author: GitLabUserReference;
  description: string;
  state: GitLabIssueState;
  assignees: GitLabUserReference[];
  assignee: GitLabUserReference;
  type: string;
  labels: GitlabLabelDetail[];
  upvotes: number;
  downvotes: number;
  merge_requests_count: number;
  title: string;
  updated_at: string;
  created_at: string;
  closed_at: string;
  closed_by: GitLabUserReference;
  user_notes_count: number;
  due_date: string;
  web_url: string;
  references: {
    short: string;
    relative: string;
    full: string;
  };
  time_stats: GitLabTimeStats;
  has_tasks: boolean;
  task_status: string;
  confidential: boolean;
  discussion_locked: boolean;
  issue_type: GitLabIssueType;
  severity: string;
  _links: {
    self: string;
    notes: string;
    award_emoji: string;
    project: string;
    closed_as_duplicate_of: string;
  };
  task_completion_status: {
    count: number;
    completed_count: number;
  };
} & GitLabIssueExtraAttributes;

export type GitLabMrApprovalRule = {
  id: number;
  name: string;
  rule_type: string;
  eligible_approvers: GitLabUserReference[];
  approvals_required: number;
  users: GitLabUserReference[];
  groups: GitLabGroup[];
  contains_hidden_groups: boolean;
  approved_by: GitLabUserReference[];
  source_rule: any;
  approved: boolean;
  overridden: boolean;
};

export type GitlabMrApprovalState = {
  approval_rules_overwritten: boolean;
  rules: GitLabMrApprovalRule[];
};
