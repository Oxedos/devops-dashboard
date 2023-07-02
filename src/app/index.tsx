/**
 *
 * App
 *
 * This component is the skeleton around the actual pages, and should only
 * contain code that should be seen on all pages. (e.g. navigation bar)
 */

import { enableMapSet } from 'immer';
import { default as React } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  BrowserRouter,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom';
import styled from 'styled-components/macro';
import { GlobalStyle } from 'styles/global-styles';

// Pages
import { GitLabDataSource } from './pages/GitLabDataSource/Loadable';
import { GitlabOAuth } from './pages/GitlabOAuth/Loadable';
import { HomePage } from './pages/HomePage/Loadable';
import { NotFoundPage } from './pages/NotFoundPage/Loadable';

import { useSelector } from 'react-redux';
import { selectDashboards } from './data/globalSlice/selectors';
import { useRssSlice } from './data/rssSlice';
import { useWhitesourceSlice } from './data/whitesourceSlice';
import { DashboardSettings } from './pages/DashboardsSettings/Loadable';
import { Whitesource } from './pages/Whitesource/Loadable';
import { loadIcons } from 'styles/FontawesomeIcons';

function path(p) {
  if (process.env.NODE_ENV === 'production') {
    return process.env.PUBLIC_URL + p;
  }
  return p;
}

// HOC that makes sure that the provided dashboardId is valid
const withDashboardIdCheckpoint = (WrappedComponent: React.FC<any>) => {
  return props => {
    const navigate = useNavigate();
    const { dashboardId }: any = useParams();
    const dashboards = useSelector(selectDashboards);

    // When a dashboardId was provided, make sure that it exists
    if (dashboardId && !dashboards.has(dashboardId)) {
      navigate(path('/'));
    }

    return <WrappedComponent {...props} />;
  };
};

export const App: React.FC = props => {
  useWhitesourceSlice();
  useRssSlice();
  enableMapSet();
  loadIcons();
  const HomeWithDashboardIdCheckpoint = withDashboardIdCheckpoint(HomePage);

  return (
    <BrowserRouter>
      <Helmet
        titleTemplate="%s - DevOps Dashboard"
        defaultTitle="DevOps Dashboard"
      >
        <meta name="description" content="A DevOps Dashboard" />
      </Helmet>
      <GlobalStyle />
      <RootWrapper>
        <ChildWrapper>
          <Routes>
            <Route
              path={path('/data/gitlab/oauth')}
              element={<GitlabOAuth />}
            />
            <Route path={path('/data/gitlab')} element={<GitLabDataSource />} />
            <Route path={path('/data/whitesource')} element={<Whitesource />} />
            <Route
              path={path('/settings/dashboards')}
              element={<DashboardSettings />}
            />
            <Route
              path={path('/')}
              element={<HomeWithDashboardIdCheckpoint />}
            />
            <Route
              path={path('/:dashboardId')}
              element={<HomeWithDashboardIdCheckpoint />}
            />
            <Route element={<NotFoundPage />} />
          </Routes>
        </ChildWrapper>
      </RootWrapper>
    </BrowserRouter>
  );
};

const RootWrapper = styled.div`
  min-height: 100vh;
  max-width: 100vw;
  overflow-x: hidden;
  display: flex;
`;

const ChildWrapper = styled.div`
  min-height: 100%;
  min-width: 100vw;
`;
