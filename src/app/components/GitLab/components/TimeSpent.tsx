import React, { useState } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { GitLabIssue } from 'app/apis/gitlab/types';
import TimeReportModal from './TimeReportModal';

const TimeSpent: React.FC<{ issue: GitLabIssue }> = props => {
  const [show, setShow] = useState(false);
  if (!props.issue) return null;

  return (
    <>
      {show && (
        <TimeReportModal issue={props.issue} onHide={() => setShow(false)} />
      )}
      <OverlayTrigger
        overlay={overlayProps => (
          <Tooltip id="tooltip" {...overlayProps}>
            <span>time spent</span>
          </Tooltip>
        )}
      >
        <Wrapper
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            e.nativeEvent.stopPropagation();
            e.nativeEvent.preventDefault();
            e.nativeEvent.stopImmediatePropagation();
            setShow(true);
          }}
        >
          <FontAwesomeIcon icon="clock" />
          {props.issue.time_stats.human_total_time_spent}
        </Wrapper>
      </OverlayTrigger>
    </>
  );
};

const Wrapper = styled.div`
  cursor: pointer;
  color: var(--clr-gray);
  display: flex;
  flex-flow: row;
  align-items: center;
  justify-content: space-between;
  gap: 0.5em;
`;

export default TimeSpent;
