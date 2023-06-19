export type GitLabGroup = {
  id: number;
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
  id: number;
  username: string;
  name: string;
  email: string;
  avatar_url: string;
};

export type GitLabUserReference = {
  id: number;
  name: string;
  username: string;
  avatar_url: string;
  web_url: string;
};

export type GitLabIssue = {
  state: string;
  description: string;
  author: GitLabUserReference;
  project_id: number;
  assignees: GitLabUserReference[];
  assignee: GitLabUserReference;
  updated_at: string;
  closed_at: string;
  closed_by: string;
  id: number;
  title: string;
  created_at: string;
  moved_to_id: string;
  iid: number;
  labels: string[];
  upvotes: number;
  downvotes: number;
  merge_requests_count: number;
  user_notes_count: number;
  due_date: string;
  web_url: string;
  task_completion_status: {
    count: number;
    completed_count: number;
  };
};

export type GitLabIssueStatistics = {
  statistics: {
    counts: {
      all: number;
      closed: number;
      opened: number;
    };
  };
};

export type GitLabProject = {
  id: number;
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
  id: number;
  name: string;
  pipeline: {
    id: number;
  };
  ref: string;
  stage: string;
  status: string;
  web_url: string;
  user: GitLabUserReference;
  allow_failure: boolean;
};

export type GitLabPipelineBasic = {
  id: number;
  project_id: number;
  status: string;
  ref: string;
  sha: string;
  web_url: string;
  created_at: string;
  updated_at: string;
};

export type GitLabPipeline = {
  // Non Gitlab attribues
  jobs: GitLabJob[];
  title: string | undefined; // Title of associated MR if present
  mr_web_url: string | undefined; // Web URL of associated MR if present
  labels: String[];
} & GitLabPipelineBasic;

export type GitLabBranch = {
  name: string;
  merged: boolean;
  protected: boolean;
  default: boolean;
  developers_can_push: boolean;
  developers_can_merge: boolean;
  can_push: boolean;
  web_url: string;
};

export type GitLabSimpleMr = {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description: string;
  state: string;
  created_at: string;
  updated_at: string;
  web_url: string;
};

export type GitLabMilestone = {
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

export type GitLabMR = {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description: string;
  state: string;
  created_at: string;
  updated_at: string;
  target_branch: string;
  source_branch: string;
  upvotes: number;
  downvotes: number;
  author: GitLabUserReference;
  user: {
    can_merge: boolean;
  };
  assignee: GitLabUserReference;
  assignees: GitLabUserReference[];
  reviewers: GitLabUserReference[];
  source_project_id: number;
  target_project_id: number;
  labels: string[];
  draft: boolean;
  work_in_progress: boolean;
  milestone: GitLabMilestone;
  merge_when_pipeline_succeeds: boolean;
  merge_status: string;
  merge_error: string;
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
  subscribed: boolean;
  changes_count: string;
  merge_user: GitLabUserData;
  merged_at: string;
  closed_by: string;
  closed_at: string;
  latest_build_started_at: string;
  latest_build_finished_at: string;
  first_deployed_to_production_at: string;
  pipeline: GitLabPipelineBasic;
  diff_refs: {
    base_sha: string;
    head_sha: string;
    start_sha: string;
  };
  diverged_commits_count: number;
  rebase_in_progress: boolean;
  first_contribution: boolean;
  task_completion_status: {
    count: number;
    completed_count: null;
  };
  has_conflicts: boolean;
  blocking_discussions_resolved: boolean;
  head_pipeline: GitLabPipelineBasic;
};
