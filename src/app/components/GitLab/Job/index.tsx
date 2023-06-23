import { GitLabJob, GitLabMR } from 'app/apis/gitlab/types';
import React, { memo, useState } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import styled from 'styled-components/macro';
import { default as PopoverBase } from 'react-bootstrap/Popover';
import { JobStatus, StatusStyle } from '../Status';
import PlayButton from '../PlayButton';

type PropTypes = {
  job: GitLabJob;
  nextJob?: GitLabJob;
  withDivider?: boolean;
  groupName: string;
  mr?: GitLabMR;
};

const Job: React.FC<PropTypes> = props => {
  const [isShown, show] = useState(false);
  const { job, mr, groupName } = props;

  const popover = innerProps => (
    <Popover id="popover-basic" {...innerProps}>
      <Popover.Header as="h3">{props.job.status}</Popover.Header>
      <Popover.Body>
        <StyledA href={props.job.web_url} target="_blank" rel="noreferrer">
          <Wrapper>
            <strong>{props.job.stage}:</strong>
            <span>{props.job.name}</span>
            {mr && job.status === 'manual' && (
              <FloatRight>
                <PlayButton
                  job={job}
                  groupName={groupName}
                  mrIid={mr.iid}
                  projectId={mr.project_id}
                />
              </FloatRight>
            )}
          </Wrapper>
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

const Wrapper = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
  gap: 1em;
`;

const FloatRight = styled.div`
  display: flex;
  flex-flow: row;
  align-items: center;
  justify-content: end;
  width: 100%;
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
    padding: 1em;
  }
  max-width: unset;
`;

export default memo(Job);
