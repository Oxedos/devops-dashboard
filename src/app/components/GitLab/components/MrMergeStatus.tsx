import React from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { GitLabMR } from 'app/apis/gitlab/types';
import { GlobalColours } from 'styles/global-styles';

const getStatusDetails = (
  mr: GitLabMR,
): { icon: IconProp; detail: string; color: string; status: string } => {
  switch (mr.detailed_merge_status) {
    case 'mergeable': {
      return {
        icon: 'check',
        color: GlobalColours.green,
        status: 'Meargeable',
        detail: 'The branch can merge cleanly into the target branch',
      };
    }
    case 'external_status_checks': {
      return {
        icon: 'times',
        color: GlobalColours.red,
        status: 'External status checks not passed',
        detail: 'All status checks must pass before merge',
      };
    }
    case 'policies_denied': {
      return {
        icon: 'times',
        color: GlobalColours.red,
        status: 'Policies denied',
        detail: 'The merge request contains denied policies',
      };
    }
    case 'not_open': {
      return {
        icon: 'times',
        color: GlobalColours.red,
        status: 'Not open',
        detail: 'The merge request must be open before merge',
      };
    }
    case 'not_approved': {
      return {
        icon: 'times',
        color: GlobalColours.red,
        status: 'Not approved',
        detail: 'Approval is required before merge',
      };
    }
    case 'draft_status': {
      return {
        icon: 'times',
        color: GlobalColours.red,
        status: 'Not ready',
        detail: "Can't merge because the merge request is a draft",
      };
    }
    case 'discussions_not_resolved': {
      return {
        icon: 'times',
        color: GlobalColours.red,
        status: 'Open discussions',
        detail: 'All discussions must be resolved before merge',
      };
    }
    case 'ci_still_running': {
      return {
        icon: 'times',
        color: GlobalColours.red,
        status: 'Pipelines still running',
        detail: 'A CI/CD pipeline is still running',
      };
    }
    case 'ci_must_pass': {
      return {
        icon: 'times',
        color: GlobalColours.red,
        status: 'Failed pipeline',
        detail: 'A CI/CD pipeline must succeed before merge',
      };
    }
    case 'broken_status': {
      return {
        icon: 'times',
        color: GlobalColours.red,
        status: 'Merge Conflicts',
        detail:
          "Can't merge into the target branch due to a potential conflict",
      };
    }
    case 'blocked_status': {
      return {
        icon: 'times',
        color: GlobalColours.red,
        status: 'Blocked',
        detail: 'Blocked by another merge request',
      };
    }
    case 'checking': {
      return {
        icon: 'question',
        color: GlobalColours.white,
        status: 'Checking',
        detail: 'Git is testing if a valid merge is possible',
      };
    }
    default:
    case 'unchecked': {
      return {
        icon: 'question',
        color: GlobalColours.white,
        status: 'unchecked',
        detail: 'Git has not yet tested if a valid merge is possible',
      };
    }
  }
};

const MrMergeStatus: React.FC<{ mr: GitLabMR }> = props => {
  const statusDetails = getStatusDetails(props.mr);
  return (
    <OverlayTrigger
      overlay={overlayProps => (
        <Tooltip id="tooltip" {...overlayProps}>
          <strong>{statusDetails.status}:</strong> {statusDetails.detail}
        </Tooltip>
      )}
    >
      <FontAwesomeIcon icon={statusDetails.icon} color={statusDetails.color} />
    </OverlayTrigger>
  );
};

export default MrMergeStatus;
