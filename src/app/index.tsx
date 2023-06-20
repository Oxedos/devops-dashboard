/**
 *
 * App
 *
 * This component is the skeleton around the actual pages, and should only
 * contain code that should be seen on all pages. (e.g. navigation bar)
 */

import * as React from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Routes,
  Route,
  BrowserRouter,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { enableMapSet } from 'immer';
import { GlobalStyle } from 'styles/global-styles';
import styled from 'styled-components/macro';

// Pages
import { HomePage } from './pages/HomePage/Loadable';
import { GitLabDataSource } from './pages/GitLabDataSource/Loadable';
import { NotFoundPage } from './pages/NotFoundPage/Loadable';

// Icon stuff
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faTachometerAlt,
  faCogs,
  faCog,
  faPlus,
  faTimes,
  faSync,
  faExclamationTriangle,
  faExclamationCircle,
  faInfoCircle,
  faTrash,
  faCircle,
  faCheck,
  faForward,
  faSpinner,
  faUser,
  faClock,
  faBars,
  faHome,
  faPause,
  faTable,
  faChartPie,
  faStream,
  faRssSquare,
  faExclamation,
  faLongArrowAltLeft,
  faLongArrowAltRight,
  faShareSquare,
  faSlash,
  faChevronRight,
  faChevronLeft,
  faChartLine,
  faUpRightFromSquare,
  faPlay,
  faCodeMerge,
  faCodePullRequest,
  faCodeBranch,
} from '@fortawesome/free-solid-svg-icons';
import {
  faGitlab,
  faAtlassian,
  faRedhat,
} from '@fortawesome/free-brands-svg-icons';
import { Whitesource } from './pages/Whitesource/Loadable';
import { useWhitesourceSlice } from './data/whitesourceSlice';
import { useRssSlice } from './data/rssSlice';
import { selectDashboards } from './data/globalSlice/selectors';
import { useSelector } from 'react-redux';
import { DashboardSettings } from './pages/DashboardsSettings/Loadable';

function path(p) {
  if (process.env.NODE_ENV === 'production') {
    return process.env.PUBLIC_URL + p;
  }
  return p;
}

const customMetric: any = {
  prefix: 'fab',
  iconName: 'metric',
  icon: [
    16,
    16,
    [],
    'f36c',
    'M6.532 7.34a2.161 2.161 0 112.936 0 2.746 2.746 0 11-2.936 0zM2 0h12a2 2 0 012 2v12a2 2 0 01-2 2H2a2 2 0 01-2-2V2a2 2 0 012-2zm0 1a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V2a1 1 0 00-1-1H2zm6 5.915a1.161 1.161 0 100-2.322 1.161 1.161 0 000 2.322zm0 4.492a1.746 1.746 0 100-3.492 1.746 1.746 0 000 3.492z',
  ],
};

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

  // Pre-Load FA Icons
  library.add(
    faTachometerAlt,
    faCogs,
    faCog,
    faPlus,
    faTimes,
    faSync,
    faExclamationTriangle,
    faExclamationCircle,
    faInfoCircle,
    faTrash,
    faCircle,
    faCheck,
    faForward,
    faSpinner,
    faUser,
    faClock,
    faBars,
    faHome,
    faGitlab,
    faAtlassian,
    faRedhat,
    faPause,
    customMetric,
    faTable,
    faChartPie,
    faStream,
    faRssSquare,
    faExclamation,
    faLongArrowAltLeft,
    faLongArrowAltRight,
    faShareSquare,
    faSlash,
    faChevronLeft,
    faChevronRight,
    faChartLine,
    faUpRightFromSquare,
    faPlay,
    faCodeMerge,
    faCodePullRequest,
    faCodeBranch,
  );

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
