import React from 'react';
import SimpleMessage from 'app/components/visualisations/components/SimpleMessage';

type PropTypes = {
  id: string;
  group?: string;
  onSettingsClick: Function;
  afterVisRemove: Function;
  pipelines_canceled?: boolean;
  pipelines_created?: boolean;
  pipelines_failed?: boolean;
  pipelines_running?: boolean;
  pipelines_success?: boolean;
  pipelines_manual?: boolean;
  displayPipelinesForBranches?: boolean;
  displayPipelinesForMRs?: boolean;
};

const noneTrue = (...args) => args.reduce((acc, curr) => acc && !curr, true);

const withPipelineConfigurationCheck = (WrappedComponent: React.FC<any>) => {
  const WrapperComponent: React.FC<PropTypes> = props => {
    if (!props.group) {
      return (
        <SimpleMessage
          id={props.id}
          title="Pipelines Widget"
          onSettingsClick={props.onSettingsClick}
          afterVisRemove={props.afterVisRemove}
          message="No Group Selected"
        />
      );
    }

    const title = `Pipelines in ${props.group}`;

    if (
      noneTrue(
        props.pipelines_canceled,
        props.pipelines_created,
        props.pipelines_failed,
        props.pipelines_running,
        props.pipelines_success,
        props.pipelines_manual,
      )
    ) {
      return (
        <SimpleMessage
          onSettingsClick={props.onSettingsClick}
          afterVisRemove={props.afterVisRemove}
          id={props.id}
          title={title}
          message="Please select at least one pipeline status to display. Use the configuation dialog for this setting"
        />
      );
    }

    if (
      noneTrue(props.displayPipelinesForMRs, props.displayPipelinesForBranches)
    ) {
      return (
        <SimpleMessage
          onSettingsClick={props.onSettingsClick}
          afterVisRemove={props.afterVisRemove}
          id={props.id}
          title={title}
          message="Please select at least one source for pipelines. Use the configuation dialog for this setting"
        />
      );
    }

    return (
      <WrappedComponent
        {...props}
        onSettingsClick={props.onSettingsClick}
        afterVisRemove={props.afterVisRemove}
        pipelines={[]}
      />
    );
  };

  return WrapperComponent;
};

export default withPipelineConfigurationCheck;
