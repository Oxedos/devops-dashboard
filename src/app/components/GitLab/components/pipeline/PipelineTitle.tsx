import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { GitLabMR, GitLabPipeline } from 'app/apis/gitlab/types';
import React from 'react';
import { styled } from 'styled-components';
import { GlobalColours } from 'styles/global-styles';
import { getMrStatusDetail } from '../MrMergeStatus';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

type PropTypes = {
  pipeline: GitLabPipeline;
  mr?: GitLabMR;
};

const PipelineTitle: React.FC<PropTypes> = props => {
  const { pipeline, mr } = props;

  const title = pipeline.title ? pipeline.title : pipeline.ref;
  const iconName = pipeline.title ? 'code-merge' : 'code-branch';
  const Wrapper = pipeline.mr_web_url ? ClickableSpan : NonClickableSpan;

  let iconColor = GlobalColours.gray;
  let icon = (
    <FontAwesomeIcon
      icon={iconName}
      color={iconColor}
      size="sm"
      style={{
        paddingRight: '0.25em',
      }}
    />
  );
  if (mr) {
    const statusDetails = getMrStatusDetail(mr);
    icon = (
      <OverlayTrigger
        overlay={overlayProps => (
          <Tooltip id="tooltip" {...overlayProps}>
            <strong>{statusDetails.status}:</strong> {statusDetails.detail}
          </Tooltip>
        )}
      >
        <FontAwesomeIcon
          icon={iconName}
          color={statusDetails.color}
          size="sm"
          style={{
            paddingRight: '0.25em',
          }}
        />
      </OverlayTrigger>
    );
  }

  return (
    <Wrapper
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        if (pipeline.mr_web_url) {
          window.open(pipeline.mr_web_url);
        }
      }}
    >
      {icon}
      {title}
    </Wrapper>
  );
};

const NonClickableSpan = styled.span``;

const ClickableSpan = styled.span`
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

export default PipelineTitle;
