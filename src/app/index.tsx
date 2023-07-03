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

import * as GitlabSlice from 'app/data/gitLabSlice';
import * as GlobalSlice from 'app/data/globalSlice';
import * as RssSlice from 'app/data/rssSlice';
import * as WhitesourceSlice from 'app/data/whitesourceSlice';
import { useSelector } from 'react-redux';
import { loadIcons } from 'styles/FontawesomeIcons';
import {
  GitlabSliceManager,
  GlobalSliceManager,
  RssSliceManager,
  WhitesourceSliceManager,
} from './data/Managers';
import { selectDashboards } from './data/globalSlice/selectors';
import { DashboardSettings } from './pages/DashboardsSettings/Loadable';
import { Whitesource } from './pages/Whitesource/Loadable';

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

export const gitLabActions = GitlabSlice.actions;
export const globalActions = GlobalSlice.actions;
export const whitesourceActions = WhitesourceSlice.actions;
export const rssActions = RssSlice.actions;

export const App: React.FC = props => {
  enableMapSet();
  loadIcons();
  const HomeWithDashboardIdCheckpoint = withDashboardIdCheckpoint(HomePage);

  return (
    <GlobalSliceManager>
      <WhitesourceSliceManager>
        <RssSliceManager>
          <GitlabSliceManager>
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
                    <Route
                      path={path('/data/gitlab')}
                      element={<GitLabDataSource />}
                    />
                    <Route
                      path={path('/data/whitesource')}
                      element={<Whitesource />}
                    />
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
          </GitlabSliceManager>
        </RssSliceManager>
      </WhitesourceSliceManager>
    </GlobalSliceManager>
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
