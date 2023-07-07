import React from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { GitLabIssue, GitLabIssueState } from 'app/apis/gitlab/types';
import moment from 'moment';
import { GlobalColours } from 'styles/global-styles';

const isToday = (issue: GitLabIssue) => {
  if (!issue.due_date) return false;
  const issueDue = moment(issue.due_date);
  const today = moment();
  return issueDue.isSameOrBefore(today, 'date');
};

const DueInDays: React.FC<{ issue: GitLabIssue }> = props => {
  if (!props.issue || !props.issue.due_date) return null;
  if (props.issue.state === GitLabIssueState.closed) return null;

  const dueDate = moment(props.issue.due_date);
  let diffInDays = dueDate.diff(moment(), 'days');
  let label = `due in ${diffInDays} ${diffInDays > 1 ? 'days' : 'day'}`;
  if (diffInDays === 0) {
    label = 'due today';
  } else if (diffInDays < 0) {
    diffInDays *= -1;
    label = `due ${diffInDays} ${diffInDays > 1 ? 'days' : 'day'} ago`;
  }
  return (
    <OverlayTrigger
      overlay={overlayProps => (
        <Tooltip id="tooltip" {...overlayProps}>
          <span>{dueDate.format('YYYY-MM-DD')}</span>
        </Tooltip>
      )}
    >
      <TimeWrapper
        style={{
          color: isToday(props.issue) ? GlobalColours.red : GlobalColours.gray,
        }}
      >
        <FontAwesomeIcon icon="flag" />
        {label}
      </TimeWrapper>
    </OverlayTrigger>
  );
};

const TimeWrapper = styled.div`
  display: flex;
  flex-flow: row;
  align-items: center;
  justify-content: space-between;
  gap: 0.5em;
`;

export default DueInDays;
