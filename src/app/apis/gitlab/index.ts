import axios, { RawAxiosRequestConfig } from 'axios';
import { normalizeUrl } from 'app/apis/apiHelper';
import { getGitLabErrorMessage, getWithKeysetPagination } from './helper';
import {
  GitLabGroup,
  GitLabIssue,
  GitLabIssueStatistics,
  GitLabMR,
  GitLabUserData,
  GitLabProject,
  GitLabJob,
  GitLabBranch,
  GitLabPipeline,
  GitLabSimpleMr,
  GitLabEvent,
} from './types';

export const API_SUFFIX = '/api/v4';

type GetGroupParams = {
  top_level_only: boolean;
};

export async function getGroups(
  url: string,
  privateToken: string,
  params?: GetGroupParams,
): Promise<GitLabGroup[]> {
  const link = normalizeUrl(url, API_SUFFIX) + '/groups';
  const config: RawAxiosRequestConfig = {
    headers: {
      'PRIVATE-TOKEN': privateToken,
    },
    params,
  };
  return getWithKeysetPagination(link, config);
}

type GetIssueTypeParams = {
  state?: 'all' | 'opened' | 'closed';
  assignee_username?: string;
  labels?: string[] | 'None' | 'Any';
  order_by?:
    | 'created_at'
    | 'updated_at'
    | 'priority'
    | 'due_date'
    | 'relative_position'
    | 'label_priority'
    | 'milestone_due'
    | 'popularity'
    | 'weight';
  scope?: 'created_by_me' | 'assigned_to_me' | 'all';
};

export async function getIssues(
  url: string,
  privateToken: string,
  groupId: number,
  params: GetIssueTypeParams = {},
): Promise<GitLabIssue[]> {
  // Set defaults
  params = {
    scope: 'all',
    state: 'opened',
    ...params,
  };
  const link = normalizeUrl(url, API_SUFFIX) + `/groups/${groupId}/issues`;
  const config = {
    headers: {
      'PRIVATE-TOKEN': privateToken,
    },
    params,
  };
  return getWithKeysetPagination(link, config);
}

export async function getIssuesStatisticsForGroup(
  url: string,
  privateToken: string,
  groupId: number,
  params: GetIssueTypeParams = {},
): Promise<GitLabIssueStatistics> {
  // Set defaults
  params = {
    scope: 'all',
    ...params,
  };
  try {
    const response = await axios.get<GitLabIssueStatistics>(
      normalizeUrl(url, API_SUFFIX) + `/groups/${groupId}/issues_statistics`,
      {
        headers: {
          'PRIVATE-TOKEN': privateToken,
        },
        params,
      },
    );
    return response.data;
  } catch (error) {
    throw new Error(getGitLabErrorMessage(error));
  }
}

export async function getIssuesStatistics(
  url: string,
  privateToken: string,
  params: GetIssueTypeParams = {},
): Promise<GitLabIssueStatistics> {
  // Set defaults
  params = {
    scope: 'all',
    ...params,
  };
  try {
    const response = await axios.get<GitLabIssueStatistics>(
      normalizeUrl(url, API_SUFFIX) + `/issues_statistics`,
      {
        headers: {
          'PRIVATE-TOKEN': privateToken,
        },
        params,
      },
    );
    return response.data;
  } catch (error) {
    throw new Error(getGitLabErrorMessage(error));
  }
}

type GetMergeRequestParams = {
  state?: 'opened' | 'closed' | 'merged';
  order_by?: 'created_at' | 'updated_at';
  sort?: 'asc' | 'desc';
  view?: 'simple';
  labels?: string[] | 'None' | 'Any';
  scope?: 'created_by_me' | 'assigned_to_me' | 'all';
  assignee_id?: number | 'None' | 'Any';
  reviewer_id?: number | 'None' | 'Any';
};

export async function getGroupMergeRequests(
  url: string,
  privateToken: string,
  groupId: number,
  params: GetMergeRequestParams = {},
): Promise<GitLabMR[]> {
  const mrListLink =
    normalizeUrl(url, API_SUFFIX) + `/groups/${groupId}/merge_requests`;
  const mrListConfig: RawAxiosRequestConfig = {
    headers: {
      'PRIVATE-TOKEN': privateToken,
    },
    params: {
      scope: 'all',
      state: 'opened',
      ...params,
    },
  };
  const mrList: GitLabSimpleMr[] = await getWithKeysetPagination(
    mrListLink,
    mrListConfig,
  );

  // GET /projects/:id/merge_requests/:merge_request_iid
  const mrPromises = mrList.map(simpleMr =>
    axios.get<GitLabMR>(
      normalizeUrl(url, API_SUFFIX) +
        `/projects/${simpleMr.project_id}/merge_requests/${simpleMr.iid}`,
      {
        headers: {
          'PRIVATE-TOKEN': privateToken,
        },
      },
    ),
  );

  const responses = await Promise.all(mrPromises);
  return responses.map(response => response.data);
}

export async function getProjectMergeRequests(
  url: string,
  privateToken: string,
  projectId: number,
  params: GetMergeRequestParams = {},
): Promise<GitLabMR[]> {
  const mrListLink =
    normalizeUrl(url, API_SUFFIX) + `/projects/${projectId}/merge_requests`;
  const mrListConfig: RawAxiosRequestConfig = {
    headers: {
      'PRIVATE-TOKEN': privateToken,
    },
    params: {
      scope: 'all',
      state: 'opened',
      ...params,
    },
  };
  const mrList: GitLabSimpleMr[] = await getWithKeysetPagination(
    mrListLink,
    mrListConfig,
  );

  // GET /projects/:id/merge_requests/:merge_request_iid
  const mrPromises = mrList.map(simpleMr =>
    axios.get<GitLabMR>(
      normalizeUrl(url, API_SUFFIX) +
        `/projects/${simpleMr.project_id}/merge_requests/${simpleMr.iid}`,
      {
        headers: {
          'PRIVATE-TOKEN': privateToken,
        },
      },
    ),
  );

  const responses = await Promise.all(mrPromises);
  return responses.map(response => response.data);
}

export async function getMergeRequests(
  url: string,
  privateToken: string,
  params: GetMergeRequestParams = {},
): Promise<GitLabMR[]> {
  // Set defaults
  const allParams = {
    scope: 'all',
    state: 'opened',
    ...params,
    view: 'simple',
  };
  const mrListLink = normalizeUrl(url, API_SUFFIX) + `/merge_requests`;
  const mrListConfig: RawAxiosRequestConfig = {
    headers: {
      'PRIVATE-TOKEN': privateToken,
    },
    params: allParams,
  };
  const mrList = await getWithKeysetPagination(mrListLink, mrListConfig);
  // GET /projects/:id/merge_requests/:merge_request_iid
  const mrPromises = mrList.map(simpleMr =>
    axios.get<GitLabMR>(
      normalizeUrl(url, API_SUFFIX) +
        `/projects/${simpleMr.project_id}/merge_requests/${simpleMr.iid}`,
      {
        headers: {
          'PRIVATE-TOKEN': privateToken,
        },
      },
    ),
  );

  const responses = await Promise.all(mrPromises);
  return responses.map(response => response.data);
}

export async function getGroupMembers(
  url: string,
  privateToken: string,
  groupId: number,
) {
  const link = normalizeUrl(url, API_SUFFIX) + `/groups/${groupId}/members/all`;
  const config = {
    headers: {
      'PRIVATE-TOKEN': privateToken,
    },
  };
  return getWithKeysetPagination(link, config);
}

export async function getUserInfo(
  url: string,
  privateToken: string,
): Promise<GitLabUserData> {
  try {
    const response = await axios.get<GitLabUserData>(
      normalizeUrl(url, API_SUFFIX) + `/user`,
      {
        headers: {
          'PRIVATE-TOKEN': privateToken,
        },
      },
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

export async function getProjects(
  url: string,
  privateToken: string,
  params: GetProjectParams,
): Promise<GitLabProject[]> {
  const link = normalizeUrl(url, API_SUFFIX) + `/projects`;
  const config: RawAxiosRequestConfig = {
    headers: {
      'PRIVATE-TOKEN': privateToken,
    },
    params,
  };
  return getWithKeysetPagination(link, config);
}

export async function getProjectsForGroup(
  url: string,
  privateToken: string,
  groupId: number,
  params?: GetProjectParams,
): Promise<GitLabProject[]> {
  const link = normalizeUrl(url, API_SUFFIX) + `/groups/${groupId}/projects`;
  const config: RawAxiosRequestConfig = {
    headers: {
      'PRIVATE-TOKEN': privateToken,
    },
    params,
  };
  return getWithKeysetPagination(link, config);
}

export async function getProject(
  url: string,
  privateToken: string,
  projectId: number,
): Promise<GitLabProject> {
  try {
    const response = await axios.get<GitLabProject>(
      normalizeUrl(url, API_SUFFIX) + `/projects/${projectId}`,
      {
        headers: {
          'PRIVATE-TOKEN': privateToken,
        },
      },
    );
    return response.data;
  } catch (error) {
    throw new Error(getGitLabErrorMessage(error));
  }
}

export async function getPipelineJobs(
  url: string,
  privateToken: string,
  projectId: number,
  pipelineId: number,
): Promise<GitLabJob[]> {
  const link =
    normalizeUrl(url, API_SUFFIX) +
    `/projects/${projectId}/pipelines/${pipelineId}/jobs`;
  const config: RawAxiosRequestConfig = {
    headers: {
      'PRIVATE-TOKEN': privateToken,
    },
  };
  return getWithKeysetPagination(link, config);
}

type GetPipelinesParams = {
  updated_after?: string;
  yaml_errors?: boolean;
};

export async function getPipelines(
  url: string,
  privateToken: string,
  projectId: number,
  params?: GetPipelinesParams,
): Promise<GitLabPipeline[]> {
  const link =
    normalizeUrl(url, API_SUFFIX) + `/projects/${projectId}/pipelines`;
  const config: RawAxiosRequestConfig = {
    headers: {
      'PRIVATE-TOKEN': privateToken,
    },
    params: {
      yaml_errors: false,
      ...params,
      order_by: 'updated_at',
      sort: 'desc',
    },
  };
  // Get all branches for project
  const branches = await getBranches(url, privateToken, projectId);

  // Get mrs for these projects
  const mrs = await getProjectMergeRequests(url, privateToken, projectId);

  // Combine them to ref parameters
  const refs = branches
    .map(branch => branch.name)
    .concat(mrs.map(mr => `refs/merge-requests/${mr.iid}/head`));

  // Get pipelines for these refs
  const pipelinePromises = refs.map(ref =>
    getWithKeysetPagination(link, {
      ...config,
      params: { ...config.params, ref },
    }),
  );
  const arrayOfPipelines: GitLabPipeline[][] = await Promise.all(
    pipelinePromises,
  );

  const isPipeline = (
    item: GitLabPipeline | undefined,
  ): item is GitLabPipeline => {
    return !!item;
  };

  const sortByLatestActivity = (x: GitLabPipeline, y: GitLabPipeline) => {
    const xTimestamp: any = x.updated_at;
    const yTimestamp: any = y.updated_at;
    return yTimestamp - xTimestamp;
  };

  // only select latest pipeline for each ref
  const pipelines = arrayOfPipelines
    .map(innerPipelines => {
      if (innerPipelines.length <= 0) return undefined;
      return innerPipelines.sort(sortByLatestActivity)[0];
    })
    .filter(isPipeline);

  // Get Jobs for each pipeline
  const jobPromises = pipelines.map(pipeline =>
    getPipelineJobs(url, privateToken, projectId, pipeline.id),
  );
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
      jobs: jobs[idx],
      project_id: pipeline.project_id || projectId,
      title,
      mr_web_url,
    };
  });
}

export async function getBranches(
  url: string,
  privateToken: string,
  projectId: number,
): Promise<GitLabBranch[]> {
  const link =
    normalizeUrl(url, API_SUFFIX) +
    `/projects/${projectId}/repository/branches`;
  const config: RawAxiosRequestConfig = {
    headers: {
      'PRIVATE-TOKEN': privateToken,
    },
  };
  return getWithKeysetPagination(link, config);
}

export async function rerunPipeline(
  url: string,
  privateToken: string,
  projectId: number,
  mrIid: string,
): Promise<GitLabPipeline> {
  const pipelineLink =
    normalizeUrl(url, API_SUFFIX) +
    `/projects/${projectId}/merge_requests/${mrIid}/pipelines`;
  const mrLink =
    normalizeUrl(url, API_SUFFIX) +
    `/projects/${projectId}/merge_requests/${mrIid}`;

  const config: RawAxiosRequestConfig = {
    headers: {
      'PRIVATE-TOKEN': privateToken,
    },
  };

  // Rerun pipeline
  let pipelineData;
  try {
    const pipelineDataResponse = await axios.post(pipelineLink, null, config);
    pipelineData = pipelineDataResponse.data;
  } catch (error) {
    throw new Error(getGitLabErrorMessage(error));
  }

  // get data for single MR
  let mrData;
  try {
    const mrDataResponse = await axios.get(mrLink, config);
    mrData = mrDataResponse.data;
  } catch (error) {
    throw new Error(getGitLabErrorMessage(error));
  }

  const jobs = await getPipelineJobs(
    url,
    privateToken,
    projectId,
    pipelineData.id,
  );

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
  privateToken: string,
  projectId: number,
  ref: string,
): Promise<GitLabPipeline> {
  const pipelineLink =
    normalizeUrl(url, API_SUFFIX) +
    `/projects/${projectId}/pipeline?ref=${ref}`;

  const config: RawAxiosRequestConfig = {
    headers: {
      'PRIVATE-TOKEN': privateToken,
    },
  };

  // Get data for single pipeline
  let pipelineData;
  try {
    const pipelineDataResponse = await axios.post(pipelineLink, null, config);
    pipelineData = pipelineDataResponse.data;
  } catch (error) {
    throw new Error(getGitLabErrorMessage(error));
  }

  const jobs = await getPipelineJobs(
    url,
    privateToken,
    projectId,
    pipelineData.id,
  );

  return {
    ...pipelineData,
    jobs: jobs,
    project_id: pipelineData.project_id || projectId,
    title: ref,
  };
}

export async function playJob(
  url: string,
  privateToken: string,
  projectId: number,
  jobId: number,
): Promise<void> {
  const playLink =
    normalizeUrl(url, API_SUFFIX) + `/projects/${projectId}/jobs/${jobId}/play`;

  const config: RawAxiosRequestConfig = {
    headers: {
      'PRIVATE-TOKEN': privateToken,
    },
  };

  // Play job that is in manual status
  try {
    await axios.post(playLink, null, config);
  } catch (error) {
    throw new Error(getGitLabErrorMessage(error));
  }
  // Do nothing else, caller has to now reload pipelines
}

export async function loadPipelineForMr(
  url: string,
  privateToken: string,
  projectId: number,
  mrIid: number,
): Promise<GitLabPipeline> {
  const mrLink =
    normalizeUrl(url, API_SUFFIX) +
    `/projects/${projectId}/merge_requests/${mrIid}`;

  const config: RawAxiosRequestConfig = {
    headers: {
      'PRIVATE-TOKEN': privateToken,
    },
  };

  // get data the associated MR
  let mrData: GitLabMR;
  try {
    const mrDataResponse = await axios.get<GitLabMR>(mrLink, config);
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
    const pipelineDataResponse = await axios.get<GitLabPipeline>(
      pipelineLink,
      config,
    );
    pipelineData = pipelineDataResponse.data;
  } catch (error) {
    throw new Error(getGitLabErrorMessage(error));
  }

  // Load jobs for this pipeline
  const jobs = await getPipelineJobs(
    url,
    privateToken,
    projectId,
    pipelineData.id,
  );

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
  privateToken: string,
  projectId: number,
  after: string,
): Promise<GitLabEvent[]> {
  const params = {
    after,
  };
  const link = normalizeUrl(url, API_SUFFIX) + `/projects/${projectId}/events`;
  const config = {
    headers: {
      'PRIVATE-TOKEN': privateToken,
    },
    params,
  };
  try {
    const response = await axios.get<GitLabEvent[]>(link, config);
    return response.data;
  } catch (error) {
    throw new Error(getGitLabErrorMessage(error));
  }
}
