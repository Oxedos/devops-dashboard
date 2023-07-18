import React, { memo, useState } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { default as PopoverBase } from 'react-bootstrap/Popover';
import styled from 'styled-components/macro';
import { GitLabJob, GitLabMR } from 'app/apis/gitlab/types';
import { getStatusProperties } from '../PipelineStatusHelper';
import PlayButton from './PlayButton';
import { default as Status, JobStatus, StatusStyle } from '../Status';

type PropTypes = {
  stage: string;
  jobs: GitLabJob[];
  nextJobs?: GitLabJob[];
  withDivider?: boolean;
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
      <PopoverBase.Header as="h3">Stage:{props.stage}</PopoverBase.Header>
      <PopoverBase.Body>
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
                    mrIid={props.mr.iid}
                    projectId={props.mr.project_id}
                  />
                </FloatRight>
              )}
            </JobLineContainer>
          );
        })}
      </PopoverBase.Body>
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
