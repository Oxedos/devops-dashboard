import { GlobalColours } from 'styles/global-styles';
import { GitLabJob, GitLabPipelineBasic } from 'app/apis/gitlab/types';

export type StatusProperties = {
  color: string;
  icon: any;
  background: string;
};

export function getStatusPropertiesForJob(job: GitLabJob): StatusProperties {
  return getStatusProperties(job.status, job.allow_failure);
}

export function getStatusPropertiesForPipeline(
  pipeline: GitLabPipelineBasic,
): StatusProperties {
  return getStatusProperties(pipeline.status, false);
}

export function getStatusProperties(
  status: string,
  allowFailure: boolean | undefined,
): StatusProperties {
  switch (status) {
    case 'skipped':
      return {
        color: GlobalColours.gray,
        icon: 'forward',
        background: GlobalColours.widget,
      };
    case 'success':
      return {
        color: GlobalColours.green,
        icon: 'check',
        background: GlobalColours.widget,
      };
    case 'failed':
      return {
        color: allowFailure ? GlobalColours.orange : GlobalColours.red,
        icon: allowFailure ? 'exclamation' : 'times',
        background: GlobalColours.widget,
      };
    case 'created':
      return {
        color: GlobalColours.gray,
        icon: 'circle',
        background: GlobalColours.widget,
      };
    case 'running':
      return {
        color: GlobalColours.blue,
        icon: 'spinner',
        background: GlobalColours.widget,
      };
    case 'manual':
      return {
        color: GlobalColours.gray,
        icon: 'cog',
        background: GlobalColours.widget,
      };
    case 'pending':
      return {
        color: GlobalColours.yellow,
        icon: 'pause',
        background: GlobalColours.widget,
      };
    case 'waiting_for_resource':
      return {
        color: GlobalColours.yellow,
        icon: 'pause',
        background: GlobalColours.widget,
      };
    case 'canceled':
      return {
        color: GlobalColours.gray,
        icon: 'slash',
        background: GlobalColours.widget,
      };
    default:
      return {
        color: 'black',
        icon: undefined,
        background: 'white',
      };
  }
}
