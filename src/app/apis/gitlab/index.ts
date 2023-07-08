import { normalizeUrl } from 'app/apis/apiHelper';
import axios from 'axios';
import sanitizeHtml from 'sanitize-html';
import { getGitLabErrorMessage, getWithKeysetPagination } from './helper';
import {
  GitLabEvent,
  GitLabGroup,
  GitLabIssue,
  GitLabJob,
  GitLabMR,
  GitLabMrExtended,
  GitLabPipeline,
  GitLabProject,
  GitLabTimeStats,
  GitLabUserData,
} from './types';

export const API_SUFFIX = '/api/v4';

/*
  GitLab API Methods
  Authorization is done via Service Worker in src/service-worker.ts with fetch interception
*/

type GetGroupParams = {
  top_level_only: boolean;
};

export async function getGroups(
  url: string,
  params?: GetGroupParams,
): Promise<GitLabGroup[]> {
  const link = normalizeUrl(url, API_SUFFIX) + '/groups';
  return getWithKeysetPagination(link, {
    params: { top_level_only: true, ...params },
  });
}

export async function getGroupMergeRequests(
  url: string,
  groupId: number,
): Promise<GitLabMR[]> {
  const mrListLink =
    normalizeUrl(url, API_SUFFIX) + `/groups/${groupId}/merge_requests`;
  const mrList: GitLabMR[] = await getWithKeysetPagination(mrListLink, {
    params: {
      scope: 'all',
      state: 'opened',
      with_labels_details: 'true',
    },
  });
  return mrList;
}

export async function getUserAssignedMrs(url: string): Promise<GitLabMR[]> {
  const mrListLink = normalizeUrl(url, API_SUFFIX) + `/merge_requests`;
  const mrList = await getWithKeysetPagination<GitLabMR>(mrListLink, {
    params: {
      state: 'opened',
      scope: 'assigned_to_me',
      order_by: 'updated_at',
      sort: 'desc',
      with_labels_details: 'true',
    },
  });
  return mrList;
}

export async function getMrsWithReviewer(
  reviewerId: number,
  url: string,
): Promise<GitLabMR[]> {
  const mrListLink = normalizeUrl(url, API_SUFFIX) + `/merge_requests`;
  const mrList = await getWithKeysetPagination<GitLabMR>(mrListLink, {
    params: {
      state: 'opened',
      reviewer_id: reviewerId,
      scope: 'all',
      order_by: 'updated_at',
      sort: 'desc',
      with_labels_details: 'true',
    },
  });
  return mrList;
}

export async function getUserInfo(url: string): Promise<GitLabUserData> {
  try {
    const response = await axios.get<GitLabUserData>(
      normalizeUrl(url, API_SUFFIX) + `/user`,
    );
    return response.data;
  } catch (error) {
    throw new Error(getGitLabErrorMessage(error));
  }
}

type GetProjectParams = {
  membership?: boolean;
  include_subgroups?: boolean;
  with_shared?: boolean;
};

export async function getProjectsForGroup(
  url: string,
  groupId: number,
  params?: GetProjectParams,
): Promise<GitLabProject[]> {
  const link = normalizeUrl(url, API_SUFFIX) + `/groups/${groupId}/projects`;
  return getWithKeysetPagination(link, {
    params: { archived: false, ...params },
  });
}

export async function getProjectsWithMembership(
  url: string,
): Promise<GitLabProject[]> {
  const link = normalizeUrl(url, API_SUFFIX) + `/projects`;
  return getWithKeysetPagination(link, {
    params: {
      membership: true,
      order_by: 'name',
      archived: false,
    },
  });
}

export async function getProject(
  url: string,
  projectId: number,
): Promise<GitLabProject> {
  try {
    const response = await axios.get<GitLabProject>(
      normalizeUrl(url, API_SUFFIX) + `/projects/${projectId}`,
    );
    return response.data;
  } catch (error) {
    throw new Error(getGitLabErrorMessage(error));
  }
}

export async function getPipelineJobs(
  url: string,
  projectId: number,
  pipelineId: number,
): Promise<GitLabJob[]> {
  const link =
    normalizeUrl(url, API_SUFFIX) +
    `/projects/${projectId}/pipelines/${pipelineId}/jobs`;
  return getWithKeysetPagination(link);
}

export async function getPipelines(
  url: string,
  projectId: number,
  mrs: GitLabMR[],
  includeBranches: boolean,
  includeMrs: boolean,
  selectedStatus: string[],
): Promise<GitLabPipeline[]> {
  if (!includeBranches && !includeMrs) return new Promise((res, _) => res([]));
  const projectPipelinesUrl =
    normalizeUrl(url, API_SUFFIX) + `/projects/${projectId}/pipelines`;

  // Get all available pipelines for branches
  let branchPipelines: GitLabPipeline[] = [];
  if (includeBranches) {
    branchPipelines = await getWithKeysetPagination<GitLabPipeline>(
      projectPipelinesUrl,
      { params: { scope: 'branches' } },
    );
  }

  // For each MR get the latest pipeline
  let mrPipelines: GitLabPipeline[] = [];
  if (includeMrs) {
    const mrPipelinesConfig = {
      order_by: 'updated_at',
      sort: 'desc',
      per_page: 1,
    };
    const refs = mrs.map(mr => `refs/merge-requests/${mr.iid}/head`);
    const pipelinePromises = refs.map(ref =>
      axios.get<GitLabPipeline[]>(projectPipelinesUrl, {
        params: { ...mrPipelinesConfig, ref },
      }),
    );
    mrPipelines = (await Promise.all(pipelinePromises))
      .map(response => response.data)
      .flat(); // Each response must contain exactly one response
  }

  // Combine both lists
  const pipelines = branchPipelines.concat(mrPipelines);

  // Get Jobs for each pipeline
  const jobPromises = pipelines
    .filter(pipeline => selectedStatus.includes(pipeline.status))
    .map(async pipeline => {
      const jobs = await getPipelineJobs(url, projectId, pipeline.id);
      return { pipelineId: pipeline.id, jobs };
    });
  let jobs = await Promise.all(jobPromises);

  // zip jobs and pipeline
  return pipelines.map((pipeline, idx) => {
    // check if that pipeline originates from a MR, not a branch
    const hasAssociatedMr = mrs.find(
      mr => `refs/merge-requests/${mr.iid}/head` === pipeline.ref,
    );
    // If it originates from a MR, add title information
    const title = hasAssociatedMr ? hasAssociatedMr.title : undefined;
    const mr_web_url = hasAssociatedMr ? hasAssociatedMr.web_url : undefined;
    return {
      ...pipeline,
      jobs:
        jobs.find(
          jobList =>
            jobList &&
            jobList.jobs &&
            jobList.jobs.length > 0 &&
            jobList.pipelineId === pipeline.id,
        )?.jobs || [],
      project_id: pipeline.project_id || projectId,
      title,
      mr_web_url,
    };
  });
}

export async function rerunPipeline(
  url: string,
  projectId: number,
  mrIid: string,
): Promise<GitLabPipeline> {
  const pipelineLink =
    normalizeUrl(url, API_SUFFIX) +
    `/projects/${projectId}/merge_requests/${mrIid}/pipelines`;
  const mrLink =
    normalizeUrl(url, API_SUFFIX) +
    `/projects/${projectId}/merge_requests/${mrIid}`;

  // Rerun pipeline
  let pipelineData;
  try {
    const pipelineDataResponse = await axios.post(pipelineLink);
    pipelineData = pipelineDataResponse.data;
  } catch (error) {
    throw new Error(getGitLabErrorMessage(error));
  }

  // get data for single MR
  let mrData;
  try {
    const mrDataResponse = await axios.get(mrLink);
    mrData = mrDataResponse.data;
  } catch (error) {
    throw new Error(getGitLabErrorMessage(error));
  }

  const jobs = await getPipelineJobs(url, projectId, pipelineData.id);

  // If it originates from a MR, add title information
  const title = mrData.title;
  return {
    ...pipelineData,
    jobs: jobs,
    project_id: pipelineData.project_id || projectId,
    title,
  };
}

export async function createPipelineForRef(
  url: string,
  projectId: number,
  ref: string,
): Promise<GitLabPipeline> {
  const pipelineLink =
    normalizeUrl(url, API_SUFFIX) +
    `/projects/${projectId}/pipeline?ref=${ref}`;

  // Trigger Pipeline
  let pipelineData;
  try {
    const pipelineDataResponse = await axios.post(pipelineLink);
    pipelineData = pipelineDataResponse.data;
  } catch (error) {
    throw new Error(getGitLabErrorMessage(error));
  }

  // Get jobs for that Pipeline
  const jobs = await getPipelineJobs(url, projectId, pipelineData.id);

  return {
    ...pipelineData,
    jobs: jobs,
    project_id: pipelineData.project_id || projectId,
    title: ref,
  };
}

export async function playJob(
  url: string,
  projectId: number,
  jobId: number,
): Promise<void> {
  const playLink =
    normalizeUrl(url, API_SUFFIX) + `/projects/${projectId}/jobs/${jobId}/play`;

  // Play job that is in manual status
  try {
    await axios.post(playLink);
  } catch (error) {
    throw new Error(getGitLabErrorMessage(error));
  }
  // Do nothing else, caller has to now reload pipelines
}

export async function loadPipelineForMr(
  url: string,
  projectId: number,
  mrIid: number,
): Promise<GitLabPipeline> {
  const mrLink =
    normalizeUrl(url, API_SUFFIX) +
    `/projects/${projectId}/merge_requests/${mrIid}`;

  // get data the associated MR
  let mrData: GitLabMrExtended;
  try {
    const mrDataResponse = await axios.get<GitLabMrExtended>(mrLink);
    mrData = mrDataResponse.data;
  } catch (error) {
    throw new Error(getGitLabErrorMessage(error));
  }

  // Load Data for head_pipeline
  const pipelineLink =
    normalizeUrl(url, API_SUFFIX) +
    `/projects/${projectId}/pipelines/${mrData.head_pipeline.id}`;
  let pipelineData: GitLabPipeline;
  try {
    const pipelineDataResponse = await axios.get<GitLabPipeline>(pipelineLink);
    pipelineData = pipelineDataResponse.data;
  } catch (error) {
    throw new Error(getGitLabErrorMessage(error));
  }

  // Load jobs for this pipeline
  const jobs = await getPipelineJobs(url, projectId, pipelineData.id);

  const title = mrData.title;
  return {
    ...pipelineData,
    jobs: jobs,
    project_id: pipelineData.project_id || projectId,
    title,
  };
}

export async function getEvents(
  url: string,
  projectId: number,
  after: string,
): Promise<GitLabEvent[]> {
  const params = {
    after,
  };
  if (!projectId) return [];
  const link = normalizeUrl(url, API_SUFFIX) + `/projects/${projectId}/events`;
  try {
    const response = await axios.get<GitLabEvent[]>(link, { params });
    return response.data;
  } catch (error) {
    throw new Error(getGitLabErrorMessage(error));
  }
}

export async function getProjectIssues(
  projectId: number,
  today: string,
  projectName: string | undefined,
  url: string,
): Promise<GitLabIssue[]> {
  const link = normalizeUrl(url, API_SUFFIX) + `/projects/${projectId}/issues`;
  let openIssues: any = await getWithKeysetPagination<GitLabIssue>(link, {
    params: { with_labels_details: true, state: 'opened' },
  });
  openIssues = openIssues.map(issue =>
    renderIssueContentAsMarkdown(issue, projectName, url),
  );
  let closedIssues: any = await getWithKeysetPagination<GitLabIssue>(link, {
    params: {
      with_labels_details: true,
      state: 'closed',
      updated_after: today,
    },
  });
  closedIssues = closedIssues.map(issue =>
    renderIssueContentAsMarkdown(issue, projectName, url),
  );
  openIssues = await Promise.all(openIssues);
  closedIssues = await Promise.all(closedIssues);
  return [...openIssues, ...closedIssues];
}

export async function setIssueState(
  projectId: number,
  issueIid: number,
  state: 'close' | 'reopen',
  projectName: string | undefined,
  url: string,
): Promise<GitLabIssue> {
  const link =
    normalizeUrl(url, API_SUFFIX) + `/projects/${projectId}/issues/${issueIid}`;
  const response = await axios.put<GitLabIssue>(link, undefined, {
    params: { state_event: state },
  });
  return renderIssueContentAsMarkdown(response.data, projectName, url);
}

export async function createNewIssue(
  projectId: number,
  issue: {
    title: string;
    description?: string;
    due_date?: string;
    labels?: string[];
  },
  projectName: string | undefined,
  url: string,
): Promise<GitLabIssue> {
  const link = normalizeUrl(url, API_SUFFIX) + `/projects/${projectId}/issues`;
  const response = await axios.post<GitLabIssue>(link, undefined, {
    params: issue,
  });
  return renderIssueContentAsMarkdown(response.data, projectName, url);
}

export async function updateIssue(
  projectId: number,
  issueIid: number,
  data: {
    description?: string;
    due_date?: string;
    title?: string;
    labels?: string[];
  },
  projectName: string | undefined,
  url: string,
): Promise<GitLabIssue> {
  const link =
    normalizeUrl(url, API_SUFFIX) + `/projects/${projectId}/issues/${issueIid}`;
  const response = await axios.put<GitLabIssue>(link, undefined, {
    params: { ...data },
  });
  return renderIssueContentAsMarkdown(response.data, projectName, url);
}

export async function addTimeSpent(
  projectId: number,
  issueIid: number,
  duration: string,
  url: string,
): Promise<GitLabTimeStats> {
  const link =
    normalizeUrl(url, API_SUFFIX) +
    `/projects/${projectId}/issues/${issueIid}/add_spent_time`;
  const response = await axios.post<GitLabTimeStats>(link, undefined, {
    params: { duration },
  });
  return response.data;
}

export async function renderIssueContentAsMarkdown(
  issue: GitLabIssue,
  projectName: string | undefined,
  url: string,
): Promise<GitLabIssue> {
  if (!issue.description) return Promise.resolve(issue);
  const link = normalizeUrl(url, API_SUFFIX) + `/markdown`;
  const response = await axios.post<{ html: string }>(link, undefined, {
    params: {
      gfm: true,
      text: issue.description,
      project: projectName,
    },
  });

  return {
    ...issue,
    renderedDescription: sanitizeHtml(response.data.html, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'input']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        input: ['type', 'class', 'checked'],
        img: ['alt', 'class', 'src'],
        table: ['class'],
        '*': ['data-sourcepos'],
      },
      transformTags: {
        img: (tagName, attribs) => ({
          tagName,
          attribs: {
            ...attribs,
            src: attribs['data-src'],
          },
        }),
        table: (tagName, attribs) => ({
          tagName,
          attribs: {
            ...attribs,
            class: 'table table-sm table-striped table-bordered table-hover',
          },
        }),
        input: (tagName, attribs) => ({
          tagName,
          attribs: {
            ...attribs,
            class: 'form-check-input',
          },
        }),
      },
    }),
  };
}
