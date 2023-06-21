import React, { memo } from 'react';
import { GitLabUserReference } from 'app/apis/gitlab/types';
import styled from 'styled-components/macro';
import Figure from 'react-bootstrap/Figure';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type PropTypes = {
  user: GitLabUserReference;
  imgOnly?: boolean;
  iconProps?: { color: string; icon: IconProp };
};

const GitLabUser: React.FC<PropTypes> = props => {
  if (!props.user) return null;

  return (
    <AuthorWrapper
      onClick={e => {
        e.stopPropagation();
        e.preventDefault();
        window.open(props.user.web_url);
      }}
    >
      <OverlayTrigger
        overlay={overlayProps => (
          <Tooltip id="button-tooltip" {...overlayProps}>
            {props.user.name}
          </Tooltip>
        )}
      >
        {props.user.avatar_url ? (
          <StyledFigure className="fa-layers">
            <Figure.Image src={props.user.avatar_url} />
            {props.iconProps && (
              <FontAwesomeIcon
                icon={props.iconProps.icon}
                color={props.iconProps.color}
              />
            )}
          </StyledFigure>
        ) : (
          <DefaultAuthorWrapper>
            {props.user.name[0].toUpperCase()}
          </DefaultAuthorWrapper>
        )}
      </OverlayTrigger>
      {!props.imgOnly && props.user.name}
    </AuthorWrapper>
  );
};

const AuthorWrapper = styled.div`
  display: flex;
  flex-flow: row;
  align-items: center;
  justify-content: flex-start;
  cursor: pointer;
`;

const StyledFigure = styled(Figure)`
  width: 2em;
  height: 2em;
  margin: 0;
  padding: 0;
  margin-right: 1em;
  img {
    border-radius: 50%;
    margin: 0;
    padding: 0;
  }
  svg {
    padding-top: 2em;
    padding-left: 1.5em;
  }
`;

const DefaultAuthorWrapper = styled.div`
  background: lightblue;
  width: 2em;
  height: 2em;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: space-around;
  user-select: none;
  margin-right: 1em;
`;

export default memo(GitLabUser);
