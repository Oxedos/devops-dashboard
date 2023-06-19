import React from 'react';
import { useSelector } from 'react-redux';
import { selectPipelinesByGroup } from 'app/data/gitLabSlice/selectors';
import SimpleMessage from 'app/components/visualisations/components/SimpleMessage';

type PropTypes = {
  id: string;
  group?: string;
  onSettingsClick: Function;
  afterVisRemove: Function;
};

const withPipelineLoadingByGroup = (WrappedComponent: React.FC<any>) => {
  const WrapperComponent: React.FC<PropTypes> = props => {
    const pipelines = useSelector(selectPipelinesByGroup);

    if (!props.group) {
      return (
        <SimpleMessage
          id={props.id}
          title="GitLab Widget"
          onSettingsClick={props.onSettingsClick}
          afterVisRemove={props.afterVisRemove}
          message="No Group Selected"
        />
      );
    }

    const pipelinesForGroup = pipelines.get(props.group) || [];

    if (pipelinesForGroup.length <= 0) {
      return (
        <SimpleMessage
          id={props.id}
          title="GitLab Widget"
          onSettingsClick={props.onSettingsClick}
          afterVisRemove={props.afterVisRemove}
          message={`Currently no pipelines in ${props.group}`}
        />
      );
    }

    return (
      <WrappedComponent
        {...props}
        onSettingsClick={props.onSettingsClick}
        afterVisRemove={props.afterVisRemove}
        pipelines={pipelinesForGroup}
      />
    );
  };

  return WrapperComponent;
};

export default withPipelineLoadingByGroup;
