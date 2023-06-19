import React, { useState } from 'react';
import styled from 'styled-components/macro';
import AddVisualisationModal from 'app/components/AddVisualisationModal';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectDashboards,
  selectLoading,
} from 'app/data/globalSlice/selectors';
import { useGitLabSlice } from 'app/data/gitLabSlice';
import NotificationContainer from '../NotificationContainer';
import { whitesourceActions } from 'app/data/whitesourceSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { rssActions } from 'app/data/rssSlice';

function addBaseUrl(to) {
  if (process.env.NODE_ENV === 'production') {
    return process.env.PUBLIC_URL + to;
  }
  return to;
}

type PropTypes = {
  displayHome?: boolean;
};

const NavigationBar: React.FC<PropTypes> = props => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { actions: gitLabActions } = useGitLabSlice();
  const dashboards = useSelector(selectDashboards);
  const dispatch = useDispatch();
  const isLoading = useSelector(selectLoading);
  const dashboardIds = Array.from(dashboards.keys());

  const reloadAll = () => {
    dispatch(gitLabActions.reload());
    dispatch(whitesourceActions.reload());
    dispatch(rssActions.reload());
  };

  return (
    <>
      {/* Visualisation Modal */}
      <AddVisualisationModal
        show={isModalOpen}
        onHide={() => setModalOpen(false)}
      />
      {/* Notification Toasts */}
      <NotificationContainer />
      {/* SideBar */}
      <Spacer
        style={{
          width: isSidebarOpen ? '14em' : '3em',
        }}
      />
      <SideBar
        style={{
          transform: isSidebarOpen ? 'translateX(0)' : undefined,
        }}
      >
        <FlexColumn>
          <SideBarButton onClick={() => navigate(addBaseUrl('/'))}>
            <span>Home</span>
            <FontAwesomeIcon icon="home" size="lg" />
          </SideBarButton>
          <SideBarButton onClick={() => reloadAll()}>
            <span>Reload</span>
            <FontAwesomeIcon icon="sync" size="lg" spin={isLoading} />
          </SideBarButton>
          <SideBarButton
            onClick={() => setModalOpen(true)}
            disabled={props.displayHome}
          >
            <span>Add Widget</span>
            <FontAwesomeIcon icon="plus" size="lg" />
          </SideBarButton>
          <hr />
          <SideBarButton
            onClick={() => navigate(addBaseUrl('/settings/dashboards'))}
          >
            <span>Dashboards</span>
            <FontAwesomeIcon icon="tachometer-alt" size="lg" />
          </SideBarButton>
          <hr />
          <SideBarButton onClick={() => navigate(addBaseUrl('/data/gitlab'))}>
            <span>GitLab</span>
            <FontAwesomeIcon icon={['fab', 'gitlab']} size="lg" />
          </SideBarButton>
          <SideBarButton
            onClick={() => navigate(addBaseUrl('/data/whitesource'))}
          >
            <span>Mend</span>
            <FontAwesomeIcon icon={['fab', 'atlassian']} size="lg" />
          </SideBarButton>
        </FlexColumn>

        <FlexColumn>
          {dashboardIds.map((dId, idx) => {
            const dashboard = dashboards.get(dId);
            if (!dashboard) return null;
            return (
              <SideBarButton
                key={dId}
                onClick={() => navigate(addBaseUrl(`/${dId}`))}
              >
                <span>{dashboard.name}</span>
                <FontAwesomeIcon icon="chart-line" size="lg" />
              </SideBarButton>
            );
          })}
        </FlexColumn>

        <FlexColumn>
          <SideBarButton onClick={() => setSidebarOpen(!isSidebarOpen)}>
            <FontAwesomeIcon
              icon={isSidebarOpen ? 'chevron-left' : 'chevron-right'}
              size="lg"
            />
          </SideBarButton>
        </FlexColumn>
      </SideBar>
    </>
  );
};

const Spacer = styled.div`
  transition: 0.5s ease-in-out;
`;

const SideBar = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  background: var(--clr-menu);
  display: flex;
  flex-flow: column;
  justify-content: space-between;
  align-items: end;
  padding-top: 1em;
  padding-bottom: 1em;
  padding-right: 0.25em;
  transition: 0.5s ease-in-out;
  width: 12em;
  transform: translateX(-75%);
`;

const FlexColumn = styled.div`
  display: flex;
  flex-flow: column;
  justify-content: flex-start;
  align-items: end;
  gap: 1em;
`;

const SideBarButton = styled.button`
  all: unset;
  flex-flow: row nowrap;

  /* border: 1px solid black; */
  padding: 5px 10px;
  border-radius: 10%;

  &:hover {
    background: var(--clr-background);
  }
  &:disabled {
    background: var(--clr-menu);
    color: var(--clr-gray);
  }

  & > span {
    margin-right: 1em;
    font-size: large;
    text-overflow: ellipsis;
    overflow: hidden;
  }
`;

NavigationBar.defaultProps = {
  displayHome: true,
};

export default NavigationBar;
