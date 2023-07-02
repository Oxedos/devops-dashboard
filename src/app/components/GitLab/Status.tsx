import React, { memo } from 'react';
import styled from 'styled-components/macro';
import {
  GitLabJob,
  GitLabPipeline,
  GitLabPipelineBasic,
} from 'app/apis/gitlab/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  getStatusPropertiesForJob,
  getStatusPropertiesForPipeline,
} from './PipelineStatusHelper';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

export enum StatusStyle {
  simple,
  round,
  boxed,
}

type ConfigProps = {
  style: StatusStyle;
  withDivider?: boolean;
  simple?: boolean;
  tooltip?: string;
  url?: string;
  onClick?: any;
  spin?: boolean;
  disabled?: boolean;
};

type BaseProps = {
  icon: any;
  color: string;
  background: string;
};

type JobStatusProps = {
  job: GitLabJob;
  nextJob?: GitLabJob;
} & ConfigProps;

const JobStatusFC: React.FC<JobStatusProps> = props => {
  const { job, nextJob, ...restProps } = props;
  let iconprops = getStatusPropertiesForJob(job);
  let nextJobIconProps: BaseProps | undefined = undefined;
  if (nextJob) {
    nextJobIconProps = getStatusPropertiesForJob(nextJob);
  }
  return (
    <Status
      icon={iconprops.icon}
      background={iconprops.background}
      color={iconprops.color}
      nextStatus={nextJobIconProps}
      {...restProps}
    />
  );
};

type PipelineProps = {
  pipeline: GitLabPipelineBasic | GitLabPipeline;
} & ConfigProps;

const PipelineStatusFC: React.FC<PipelineProps> = props => {
  const { pipeline, ...restProps } = props;
  let iconprops = getStatusPropertiesForPipeline(pipeline);
  return (
    <Status
      icon={iconprops.icon}
      background={iconprops.background}
      color={iconprops.color}
      {...restProps}
    />
  );
};

type StatusProps = {
  nextStatus?: BaseProps;
} & BaseProps &
  ConfigProps;

const Status: React.FC<StatusProps> = props => {
  let icon = (
    <FontAwesomeIcon icon={props.icon} color={props.color} spin={props.spin} />
  );

  if (props.style && props.style === StatusStyle.round) {
    icon = (
      <RoundedContainer className="fa-layers ">
        <FontAwesomeIcon
          icon="circle"
          color={props.color}
          transform="grow-15"
        />
        <FontAwesomeIcon
          icon="circle"
          color={props.background}
          transform="grow-10"
        />
        <FontAwesomeIcon
          icon="circle"
          color="rgba(229, 80, 57, 0.25)"
          transform="grow-10"
        />
        {icon}
      </RoundedContainer>
    );
  }
  if (props.style && props.style === StatusStyle.boxed) {
    icon = <BoxedContainer color={props.color}>{icon}</BoxedContainer>;
  }

  if (props.url) {
    icon = (
      <a
        href={props.url}
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          window.open(props.url);
        }}
      >
        {icon}
      </a>
    );
  }

  if (props.tooltip) {
    icon = (
      <OverlayTrigger
        placement="right"
        overlay={overlayProps => (
          <Tooltip id="button-tooltip" {...overlayProps}>
            {props.tooltip}
          </Tooltip>
        )}
      >
        {icon}
      </OverlayTrigger>
    );
  }

  let divider;
  if (props.withDivider && props.nextStatus) {
    divider = (
      <DividerGradient
        theme={{
          gradient: `linear-gradient(to right, ${props.color}, ${props.nextStatus.color})`,
        }}
      />
    );
  } else if (props.withDivider) {
    divider = <Divider color={props.color} />;
  }

  return (
    <Wrapper
      onClick={!props.disabled && props.onClick ? props.onClick : undefined}
    >
      {icon}
      {divider}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-flow: row wrap;
  align-items: center;
`;

const RoundedContainer = styled.span`
  min-height: 1.8em;
  min-width: 1.8em;
  cursor: pointer;
`;

const BoxedContainer = styled.div`
  border: 3px solid;
  border-color: ${(props: any) => props.color};
  border-radius: 0.5em;
  min-width: 2.25em;
  min-height: 2.25em;
  display: flex;
  align-items: center;
  justify-content: space-around;
`;

const Divider = styled.div`
  max-width: 1em;
  width: 0.5em;
  min-width: 0.25em;
  height: 5px;
  flex-shrink: 1;
  flex-grow: 1;
  background: ${(props: any) => props.color};
`;

const DividerGradient = styled.div`
  max-width: 1em;
  width: 0.5em;
  min-width: 0.25em;
  height: 5px;
  flex-shrink: 1;
  flex-grow: 1;
  background-image: ${(props: any) => props.theme.gradient};
`;

export default memo(Status);
export const JobStatus = memo(JobStatusFC);
export const PipelineStatus = memo(PipelineStatusFC);
