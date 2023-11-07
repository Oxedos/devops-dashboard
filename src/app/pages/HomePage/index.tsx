import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router';
import styled from 'styled-components';
import Dashboard from 'app/components/Dashboard/Dashboard';
import NavigationBar from 'app/components/Dashboard/NavigationBar';
import {
  getDashbaordId,
  selectDashboards,
} from 'app/data/globalSlice/selectors';

export function HomePage() {
  const { dashboardId }: any = useParams();
  const dashboards = useSelector(selectDashboards);
  const dId = getDashbaordId(dashboards, dashboardId) || '';
  const dashboard = dashboards.get(dId);
  const visualisations = dashboard?.visualisations || [];

  return (
    <>
      <Helmet>
        <title>{dashboard?.name || 'Home Page'}</title>
        <meta name="description" content="A DevOps Dashboard" />
      </Helmet>
      <Wrapper>
        <NavigationBar displayHome={false} />
        <Dashboard dashboardId={dId} visualisations={visualisations} />
      </Wrapper>
    </>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-flow: row no-wrap;
  width: 100%;
  height: 100%;
`;
