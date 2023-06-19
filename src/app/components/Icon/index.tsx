import * as React from 'react';
import styled from 'styled-components/macro';
import { Link as RouterLink } from 'react-router-dom';
import {
  FontAwesomeIcon,
  FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome';

type PropTypes = {
  to?: string;
  iconProps: FontAwesomeIconProps;
};

function addBaseUrl(to) {
  if (process.env.NODE_ENV === 'production') {
    return process.env.PUBLIC_URL + to;
  }
  return to;
}

const Link: React.FunctionComponent<PropTypes> = ({ to, iconProps }) => {
  if (to) {
    return (
      <IconLink to={addBaseUrl(to)}>
        <FontAwesomeIcon {...iconProps} />
      </IconLink>
    );
  }
  return <FontAwesomeIcon {...iconProps} />;
};

const IconLink = styled(RouterLink)`
  color: unset;
  text-decoration: none;
  & :hover {
    color: unset;
  }
`;

export default Link;
