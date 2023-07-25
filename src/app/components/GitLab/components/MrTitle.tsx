import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { GitLabMR } from 'app/apis/gitlab/types';
import React from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { styled } from 'styled-components';
import { getMrStatusDetail } from './MrMergeStatus';

type PropTypes = {
  mr: GitLabMR;
};

const MrTitle: React.FC<PropTypes> = props => {
  const { mr } = props;

  const statusDetails = getMrStatusDetail(mr);
  const icon = (
    <OverlayTrigger
      overlay={overlayProps => (
        <Tooltip id="tooltip" {...overlayProps}>
          <strong>{statusDetails.status}:</strong> {statusDetails.detail}
        </Tooltip>
      )}
    >
      <FontAwesomeIcon
        icon="code-merge"
        color={statusDetails.color}
        size="sm"
        style={{
          paddingRight: '0.25em',
        }}
      />
    </OverlayTrigger>
  );

  return (
    <ClickableSpan
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        if (mr.web_url) {
          window.open(mr.web_url);
        }
      }}
    >
      {icon}
      {mr.title}
    </ClickableSpan>
  );
};

const ClickableSpan = styled.span`
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

export default MrTitle;
