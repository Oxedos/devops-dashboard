import React, { useState } from 'react';
import styled from 'styled-components/macro';
import AddVisualisationModal from 'app/components/visualisations/AddVisualisationModal';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectDashboards,
  selectLoading,
} from 'app/data/globalSlice/selectors';
import NotificationContainer from './NotificationContainer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { rssActions, whitesourceActions, gitLabActions } from 'app';

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
          width: isSidebarOpen ? '13.5em' : '3em',
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
  background: var(--clr-background);
  display: flex;
  flex-flow: column;
  justify-content: space-between;
  align-items: end;
  padding-top: 1em;
  padding-bottom: 1em;
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
  display: flex;
  flex-flow: row nowrap;
  max-width: 10em;
  align-items: center;
  justify-content: end;
  padding: 5px 15px;
  border-radius: 0.5em;

  &:hover {
    background: var(--clr-widget);
  }
  &:disabled {
    background: var(--clr-background);
    color: var(--clr-gray);
  }

  & > span {
    margin-right: 1em;
    font-size: large;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    max-width: 100%;
  }
`;

NavigationBar.defaultProps = {
  displayHome: true,
};

export default NavigationBar;
