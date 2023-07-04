import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import moment from 'moment';
import React from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import styled from 'styled-components/macro';

type PropTypes = {
  timestamp: string;
};

const RelativeTime: React.FC<PropTypes> = props => {
  const time = moment(props.timestamp);
  return (
    <OverlayTrigger
      overlay={overlayProps => (
        <Tooltip id="tooltip" {...overlayProps}>
          <span>{time.format('D MMMM YYYY HH:mm')}</span>
        </Tooltip>
      )}
    >
      <TimeWrapper>
        <FontAwesomeIcon icon="clock" className="mr-2" />
        <span>{time.fromNow()}</span>
      </TimeWrapper>
    </OverlayTrigger>
  );
};

const TimeWrapper = styled.div`
  padding-right: 1em;
  white-space: nowrap;
  & > span {
    padding-left: 0.5em;
  }
  color: var(--clr-gray);
`;

export default RelativeTime;
