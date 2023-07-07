import { createSelector } from '@reduxjs/toolkit';
import { RootState } from 'types';
import { initialState } from '.';
import { Dashboard } from './types';

const selectSlice = (state: RootState) => state?.global || initialState;

export const selectGlobal = createSelector([selectSlice], state => state);
export const selectLoading = createSelector(
  selectGlobal,
  state => state.loaders.length > 0,
);
export const selectLoaders = createSelector(
  selectGlobal,
  state => state.loaders,
);
export const selectDashboards = createSelector(
  selectGlobal,
  state => state.dashboards,
);
export const selectNotifications = createSelector(
  selectGlobal,
  state => state.notifications,
);
export const selectConfiguredVisualisations = createSelector(
  selectGlobal,
  state => {
    if (!state || !state.dashboards) return [];
    return Array.from(state.dashboards.values()).flatMap(
      dashboard => dashboard.visualisations,
    );
  },
);

// Helper functions
export const getDashbaordId = (
  dashboards: Map<string, Dashboard>,
  dashboardIdFromParams: string | undefined,
) => {
  const mainDashboardId = Array.from(dashboards.keys()).find(dbId => {
    const dashboard = dashboards.get(dbId);
    if (!dashboard) return false;
    return dashboard.isMainDashboard;
  });

  if (!dashboardIdFromParams && !mainDashboardId) return undefined;
  if (dashboardIdFromParams) return dashboardIdFromParams;
  return mainDashboardId;
};
