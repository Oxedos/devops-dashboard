import { normalizeUrl } from 'app/apis/apiHelper';
import axios, { RawAxiosRequestConfig } from 'axios';
import {
  getGitLabErrorMessage,
  getWithKeysetPagination,
  gitlabConfig,
} from './helper';
import {
  GitLabEvent,
  GitLabGroup,
  GitLabJob,
  GitLabMR,
  GitLabPipeline,
  GitLabProject,
  GitLabSimpleMr,
  GitLabUserData,
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
): Promise<GitLabSimpleMr[]> {
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
  return mrList;
}

export async function getMergeRequests(
  url: string,
  privateToken: string,
  params: GetMergeRequestParams = {},
): Promise<GitLabSimpleMr[]> {
  // Set defaults
  const allParams = {
    scope: 'all',
    state: 'opened',
    ...params,
  };
  const mrListLink = normalizeUrl(url, API_SUFFIX) + `/merge_requests`;
  const mrListConfig: RawAxiosRequestConfig = {
    headers: {
      'PRIVATE-TOKEN': privateToken,
    },
    params: allParams,
  };
  const mrList = await getWithKeysetPagination<GitLabSimpleMr>(
    mrListLink,
    mrListConfig,
  );
  return mrList;
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

export async function getProjectsForGroup(
  url: string,
  privateToken: string,
  groupId: number,
  params?: GetProjectParams,
): Promise<GitLabProject[]> {
  const link = normalizeUrl(url, API_SUFFIX) + `/groups/${groupId}/projects`;
  return getWithKeysetPagination(link, gitlabConfig(params, privateToken));
}

export async function getProject(
  url: string,
  privateToken: string,
  projectId: number,
): Promise<GitLabProject> {
  try {
    const response = await axios.get<GitLabProject>(
      normalizeUrl(url, API_SUFFIX) + `/projects/${projectId}`,
      gitlabConfig({}, privateToken),
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
  return getWithKeysetPagination(link, gitlabConfig({}, privateToken));
}

export async function getPipelines(
  url: string,
  privateToken: string,
  projectId: number,
  mrs: GitLabMR[],
): Promise<GitLabPipeline[]> {
  const projectPipelinesUrl =
    normalizeUrl(url, API_SUFFIX) + `/projects/${projectId}/pipelines`;

  // Get all available pipelines for branches
  const branchPipelines = await getWithKeysetPagination<GitLabPipeline>(
    projectPipelinesUrl,
    gitlabConfig({ scope: 'branches' }, privateToken),
  );

  // For each MR get the latest pipeline
  const mrPipelinesConfig = {
    order_by: 'updated_at',
    sort: 'desc',
    per_page: 1,
  };
  const refs = mrs.map(mr => `refs/merge-requests/${mr.iid}/head`);
  const pipelinePromises = refs.map(ref =>
    axios.get<GitLabPipeline[]>(
      projectPipelinesUrl,
      gitlabConfig({ ...mrPipelinesConfig, ref }, privateToken),
    ),
  );
  const mrPipelines: GitLabPipeline[] = (await Promise.all(pipelinePromises))
    .map(response => response.data)
    .flat(); // Each response must contain exactly one response

  // Combine both lists
  const pipelines = branchPipelines.concat(mrPipelines);

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

  const config = gitlabConfig({}, privateToken);

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

  const config = gitlabConfig({}, privateToken);

  // Trigger Pipeline
  let pipelineData;
  try {
    const pipelineDataResponse = await axios.post(pipelineLink, null, config);
    pipelineData = pipelineDataResponse.data;
  } catch (error) {
    throw new Error(getGitLabErrorMessage(error));
  }

  // Get jobs for that Pipeline
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

  const config = gitlabConfig({}, privateToken);

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

  const config = gitlabConfig({}, privateToken);

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
  if (!projectId) return [];
  const link = normalizeUrl(url, API_SUFFIX) + `/projects/${projectId}/events`;
  const config = gitlabConfig(params, privateToken);
  try {
    const response = await axios.get<GitLabEvent[]>(link, config);
    return response.data;
  } catch (error) {
    throw new Error(getGitLabErrorMessage(error));
  }
}
