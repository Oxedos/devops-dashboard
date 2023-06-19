import { GitLabJob } from 'app/apis/gitlab/types';
import React, { memo, useState } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import styled from 'styled-components/macro';
import { default as PopoverBase } from 'react-bootstrap/Popover';
import { JobStatus, StatusStyle } from '../Status';

type PropTypes = {
  job: GitLabJob;
  nextJob?: GitLabJob;
  withDivider?: boolean;
};

const Job: React.FC<PropTypes> = props => {
  const [isShown, show] = useState(false);

  const popover = innerProps => (
    <Popover id="popover-basic" {...innerProps}>
      <Popover.Header as="h3">{props.job.status}</Popover.Header>
      <Popover.Body>
        <StyledA href={props.job.web_url} target="_blank" rel="noreferrer">
          {props.job.stage} / {props.job.name}
        </StyledA>
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
      <Cursor onClick={() => show(!isShown)}>
        <JobStatus
          job={props.job}
          style={StatusStyle.round}
          withDivider={props.withDivider}
          nextJob={props.nextJob}
        />
      </Cursor>
    </OverlayTrigger>
  );
};

const Cursor = styled.span`
  cursor: pointer;
`;

const StyledA = styled.a`
  color: var(--clr-white);
  text-decoration: none;
`;

const Popover = styled(PopoverBase)`
  & .popover-arrow:after,
  & .popover-header:before {
    border-bottom-color: var(--clr-menu);
    background: transparent;
  }
  & .popover-header {
    background: var(--clr-menu);
  }
  background: var(--clr-menu);
  & * {
    color: var(--clr-white);
  }
  a {
    color: inherit;
    word-wrap: none;
  }
`;

export default memo(Job);
