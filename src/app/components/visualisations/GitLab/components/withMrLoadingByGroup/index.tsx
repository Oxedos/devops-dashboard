import React from 'react';
import { useSelector } from 'react-redux';
import {
  selectAllMrs,
  selectMrsByGroup,
  selectPipelines,
  selectPipelinesByGroup,
} from 'app/data/gitLabSlice/selectors';
import { GitLabPipeline } from 'app/apis/gitlab/types';

type PropTypes = {
  id: string;
  group?: string;
};

const withMrLoadingByGroup = (WrappedComponent: React.FC<any>) => {
  const WrapperComponent: React.FC<PropTypes> = props => {
    const allMrs = useSelector(selectAllMrs);
    const allPipelines = useSelector(selectPipelines);
    const groupMrs = useSelector(selectMrsByGroup);
    const groupPipelines = useSelector(selectPipelinesByGroup);

    const groupName =
      props.group && props.group !== '[All Groups]' ? props.group : undefined;
    if (!groupName) {
      return <WrappedComponent {...props} mrs={allMrs} />;
    }

    const mrIds = groupMrs.get(groupName);
    if (!mrIds || mrIds.length <= 0) {
      return <WrappedComponent {...props} mrs={[]} />;
    }
    const mrs = allMrs.filter(mr => mrIds.includes(mr.id));
    const pipelineIds = groupPipelines.get(groupName);
    let pipelines: GitLabPipeline[] = [];
    if (pipelineIds && pipelineIds.length > 0) {
      pipelines = allPipelines.filter(pipeline =>
        pipelineIds.includes(pipeline.id),
      );
    }

    return <WrappedComponent {...props} mrs={mrs} pipelines={pipelines} />;
  };

  WrapperComponent.defaultProps = {
    group: '[All Groups]',
  };

  return WrapperComponent;
};

export default withMrLoadingByGroup;
