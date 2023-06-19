import React, { useState } from 'react';
import styled from 'styled-components/macro';
import {
  GitLabGroup,
  GitLabUserData,
  GitLabMR,
  GitLabProject,
} from 'app/apis/gitlab/types';
import Figure from 'react-bootstrap/Figure';
import UserData from '../UserData';
import Groups from '../Groups';
import MergeRequests from '../MergeRequests';
import Manage from '../Manage';
import ContentWrapper from 'app/components/Design/ContentWrapper';
import NavBar from '../../../../components/Design/NavBar';

type PropTypes = {
  userData: GitLabUserData | undefined;
  groups: GitLabGroup[];
  mrs: GitLabMR[];
  projects: GitLabProject[];
};

const GitLabData: React.FC<PropTypes> = props => {
  const [activeMenu, setActiveMenu] = useState('data');
  const { userData } = props;

  if (!userData) {
    return null;
  }
  const NavItems = [
    {
      id: 'data',
      label: 'User Data',
    },
    {
      id: 'groups',
      label: 'Groups',
    },
    {
      id: 'mr',
      label: 'Merge Requests',
    },
    {
      id: 'manage',
      label: 'Manage',
    },
  ];
  return (
    <>
      <UserTitleWrapper>
        <StyledFigure>
          <Figure.Image style={{ height: '5em' }} src={userData.avatar_url} />
        </StyledFigure>
        <h3>
          {userData.name} - @{userData.username}
        </h3>
        <NavBar
          active={activeMenu}
          onMenuItemClick={setActiveMenu}
          items={NavItems}
        />
      </UserTitleWrapper>
      <ContentWrapper>
        {activeMenu === 'data' && <UserData userData={userData} />}
        {activeMenu === 'groups' && <Groups />}
        {activeMenu === 'mr' && <MergeRequests />}
        {activeMenu === 'manage' && <Manage />}
      </ContentWrapper>
    </>
  );
};

const UserTitleWrapper = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: space-evenly;
  width: 100vw;
  background: var(--clr-widget);
  min-height: 10em;
  * {
    padding-top: 1em;
  }
`;

const StyledFigure = styled(Figure)`
  margin: 0;
  padding: 0;
  padding-top: 1em;
  img {
    margin: 0;
    padding: 0;
    border-radius: 50%;
  }
`;

export default GitLabData;
