import { GitLabMR, GitLabPipeline } from 'app/apis/gitlab/types';
import React from 'react';
import { GlobalColours } from 'styles/global-styles';
import CompactPipeline from './CompactPipeline';
import RelaxedPipeline from './RelaxedPipeline';

export type PipelinePropTypes = {
  pipeline: GitLabPipeline;
  groupName: string;
  compact?: boolean;
  showStages?: boolean;
  mr?: GitLabMR;
};

export const getPipelineBackgroundColor = (pipeline: GitLabPipeline) => {
  const alpha = '20';
  if (pipeline.status === 'failed') {
    return GlobalColours.red + alpha;
  } else if (pipeline.status === 'running') {
    return GlobalColours.blue + alpha;
  } else if (pipeline.status === 'created') {
    return undefined;
  } else if (pipeline.status === 'success') {
    return GlobalColours.green + alpha;
  } else if (pipeline.status === 'manual') {
    return undefined;
  } else if (pipeline.status === 'pending') {
    return GlobalColours.yellow + alpha;
  }
  return undefined;
};

const Pipeline: React.FC<PipelinePropTypes> = props => {
  if (props.compact) {
    return <CompactPipeline {...props} />;
  }
  return <RelaxedPipeline {...props} />;
};

export default Pipeline;
