import React, { memo, useState } from 'react';
import styled from 'styled-components/macro';
import { GitLabJob, GitLabMR } from 'app/apis/gitlab/types';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { getStatusProperties } from '../PipelineStatusHelper';
import { default as PopoverBase } from 'react-bootstrap/Popover';
import { default as Status, JobStatus, StatusStyle } from '../Status';
import PlayButton from '../PlayButton';

type PropTypes = {
  stage: string;
  jobs: GitLabJob[];
  nextJobs?: GitLabJob[];
  withDivider?: boolean;
  groupName: string;
  mr?: GitLabMR;
};

const statusPrecedence = [
  'running',
  'manual',
  'failed',
  'pending',
  'created',
  'canceled',
  'skipped',
  'success',
];

const findStageStatus = (jobs: GitLabJob[]) => {
  let stageStatus;
  const jobStatus = jobs.map(job => job.status);
  for (let status of statusPrecedence) {
    if (jobStatus.includes(status)) {
      stageStatus = status;
      break;
    }
  }
  return stageStatus;
};

const isFailureAllowed = (jobs: GitLabJob[]) => {
  return (
    jobs
      .filter(job => job.status === 'failed')
      .filter(job => job.allow_failure === false).length <= 0
  );
};

const Stage: React.FC<PropTypes> = props => {
  const [isShown, show] = useState(false);
  const stageStatus = findStageStatus(props.jobs);
  const stageFailureAllowed = isFailureAllowed(props.jobs);
  const stageIconProperties = getStatusProperties(
    stageStatus,
    stageFailureAllowed,
  );
  let nextStageIconProperties;
  if (props.nextJobs) {
    const nextStageStatus = findStageStatus(props.nextJobs);
    const nextStageFailureAllowed = isFailureAllowed(props.nextJobs);
    nextStageIconProperties = getStatusProperties(
      nextStageStatus,
      nextStageFailureAllowed,
    );
  }

  const popover = innerProps => (
    <Popover id="popover-basic" {...innerProps}>
      <Popover.Header as="h3">Stage:{props.stage}</Popover.Header>
      <Popover.Body>
        {props.jobs.map(job => {
          return (
            <JobLineContainer
              key={props.stage}
              href={job.web_url}
              target="_blank"
              rel="norefferer"
            >
              <JobStatus job={job} style={StatusStyle.round} />
              <strong>{job.name}</strong>
              {props.mr && job.status === 'manual' && (
                <FloatRight>
                  <PlayButton
                    job={job}
                    groupName={props.groupName}
                    mrIid={props.mr.id}
                    projectId={props.mr.project_id}
                  />
                </FloatRight>
              )}
            </JobLineContainer>
          );
        })}
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger
      trigger="click"
      rootClose
      placement="bottom"
      overlay={popover}
      show={isShown}
      onToggle={() => show(!isShown)}
    >
      <Cursor>
        <Status
          icon={stageIconProperties.icon}
          background={stageIconProperties.background}
          color={stageIconProperties.color}
          withDivider={props.withDivider}
          nextStatus={nextStageIconProperties}
          style={StatusStyle.round}
        />
      </Cursor>
    </OverlayTrigger>
  );
};

const Cursor = styled.div`
  cursor: pointer;
`;

const FloatRight = styled.div`
  display: flex;
  flex-flow: row;
  align-items: center;
  justify-content: end;
  width: 100%;
`;

const JobLineContainer = styled.a`
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: 1em;
  padding: 1em;
  cursor: pointer;
  text-decoration: none;
  &:hover {
    background: var(--clr-background);
  }
`;

const Popover = styled(PopoverBase)`
  border: 1px solid var(--clr-white);
  & .popover-arrow:after,
  & .popover-header:before {
    border-bottom-color: var(--clr-menu);
    background: transparent;
  }
  & .popover-header {
    background: var(--clr-menu);
  }
  background: var(--clr-menu);
  & *:not(svg, g, path) {
    color: var(--clr-white);
  }
  a {
    color: inherit;
    word-wrap: none;
  }
  & .popover-body {
    display: flex;
    flex-flow: column nowrap;
    gap: 1em;
    padding: 0.5em 0;
  }
  max-width: unset;
`;

export default memo(Stage);
