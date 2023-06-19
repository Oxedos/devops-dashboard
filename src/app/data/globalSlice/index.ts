import { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from 'utils/@reduxjs/toolkit';
import { useInjectReducer, useInjectSaga } from 'utils/redux-injectors';
import { Dashboard, GlobalState, NotificationType } from './types';
import { globalSaga } from './saga';
import * as PersistanceAPI from 'app/apis/persistance';
import {
  ConfiguredVisualisation,
  getDefaultSize,
  VisualisationType,
} from '../VisualisationTypes';
import { v4 as uuidv4 } from 'uuid';

export const LOCALSTORAGE_KEY = 'global_state';

const createInitialDashboard = (persistedState: any) => {
  const dashboard: Dashboard = {
    name: 'Main Dashboard',
    visualisations: persistedState?.visualisations || [], // try and rescue visualisations from old version
    isMainDashboard: true,
  };
  const dashboardMap = new Map<string, Dashboard>();
  dashboardMap.set(uuidv4(), dashboard);
  return dashboardMap;
};

const loadInitialState = (): GlobalState => {
  const persistedState: GlobalState =
    PersistanceAPI.loadFromLocalStorage(LOCALSTORAGE_KEY);
  return {
    loaders: [],
    dashboards:
      persistedState?.dashboards || createInitialDashboard(persistedState),
    notifications: persistedState?.notifications || [],
  };
};

export const initialState: GlobalState = loadInitialState();

const getMaxXY = (dasboard: Dashboard) => {
  if (dasboard.visualisations.length <= 0) {
    return { x: 0, y: 0 };
  }
  let maxX = 0;
  let maxY = 0;
  dasboard.visualisations.forEach(vis => {
    if (vis.x > maxX) maxX = vis.x;
    if (vis.y > maxY) maxY = vis.y;
  });
  return { x: maxX + 1, y: maxY + 1 };
};

const slice = createSlice({
  name: 'global',
  initialState,
  reducers: {
    addLoader(state, action: PayloadAction<{ id: string }>) {
      if (!state.loaders.includes(action.payload.id)) {
        state.loaders.push(action.payload.id);
      }
    },
    removeLoader(state, action: PayloadAction<{ id: string }>) {
      state.loaders = state.loaders.filter(id => id !== action.payload.id);
    },
    addVisualisation(
      state,
      action: PayloadAction<{
        dashboardId: string;
        id: string;
        type: VisualisationType;
      }>,
    ) {
      const {
        payload: { id, type, dashboardId },
      } = action;
      const dashboard = state.dashboards.get(dashboardId);
      if (!dashboard) return;
      const vis: ConfiguredVisualisation = {
        id,
        type,
        ...getDefaultSize(type),
        ...getMaxXY(dashboard),
      };
      dashboard.visualisations.push(vis);
    },
    updateDashboardLayout(
      state,
      action: PayloadAction<{
        dashboardId: string;
        layout: { i: string; x: number; y: number; h: number; w: number }[];
      }>,
    ) {
      const dashboard = state.dashboards.get(action.payload.dashboardId);
      if (!dashboard) return;
      action.payload.layout?.forEach(elem => {
        const idx = dashboard.visualisations.findIndex(
          vis => vis.id === elem.i,
        );
        if (idx === -1) return;
        const { x, y, h, w } = elem;
        dashboard.visualisations[idx] = {
          ...dashboard.visualisations[idx],
          x,
          y,
          h,
          w,
        };
      });
    },
    setVisualisationProps(
      state,
      action: PayloadAction<{ id: string; props: any }>,
    ) {
      const dashboardIds = Array.from(state.dashboards.keys());
      // Go through all dashboards and find the visualisation with the given id
      // this works as id's are unique across all dashboards
      dashboardIds.forEach(dashboardId => {
        const dashboard = state.dashboards.get(dashboardId);
        if (!dashboard) return;
        const idx = dashboard.visualisations.findIndex(
          vis => vis.id === action.payload.id,
        );
        if (idx === -1) return;
        dashboard.visualisations[idx].props = action.payload.props;
      });
    },
    removeVisualisation(state, action: PayloadAction<string>) {
      const dashboardIds = Array.from(state.dashboards.keys());
      dashboardIds.forEach(dashboardId => {
        const dashboard = state.dashboards.get(dashboardId);
        if (!dashboard) return;
        dashboard.visualisations = dashboard.visualisations.filter(
          vis => vis.id !== action.payload,
        );
      });
    },
    addErrorNotification(state, action: PayloadAction<string>) {
      const notification = {
        message: action.payload,
        id: uuidv4(),
        time: new Date().toISOString(),
        type: NotificationType.error,
      };
      state.notifications.push(notification);
    },
    addWarningNotification(state, action: PayloadAction<string>) {
      const notification = {
        message: action.payload,
        id: uuidv4(),
        time: new Date().toISOString(),
        type: NotificationType.warning,
      };
      state.notifications.push(notification);
    },
    addNotification(state, action: PayloadAction<string>) {
      const notification = {
        message: action.payload,
        id: uuidv4(),
        time: new Date().toISOString(),
        type: NotificationType.info,
      };
      state.notifications.push(notification);
    },
    deleteNotification(state, action: PayloadAction<string>) {
      state.notifications = state.notifications.filter(
        n => n.id !== action.payload,
      );
    },
    addDashboard(
      state,
      action: PayloadAction<{
        name: string;
        isMainDashboard: boolean;
      }>,
    ) {
      const {
        payload: { name, isMainDashboard },
      } = action;
      const dashboardId = uuidv4();
      if (state.dashboards.has(dashboardId)) return;
      // if a new main dashboard is set, set all others to non-main
      if (isMainDashboard) {
        Array.from(state.dashboards.keys()).forEach(dId => {
          const dashboard = state.dashboards.get(dId);
          if (!dashboard) return;
          state.dashboards.set(dId, {
            ...dashboard,
            isMainDashboard: false,
          });
        });
      }
      // Add new dashbaord
      state.dashboards.set(dashboardId, {
        name,
        isMainDashboard,
        visualisations: [],
      });
    },
    removeDashboard(
      state,
      action: PayloadAction<{
        dashboardId: string;
      }>,
    ) {
      const {
        payload: { dashboardId },
      } = action;
      const dashboard = state.dashboards.get(dashboardId);
      if (!dashboard) return;
      if (dashboard.isMainDashboard) return; // Cannot remove main dashboard
      if (state.dashboards.size <= 1) return; // Cannot remove last dashboard
      state.dashboards.delete(dashboardId);
    },
    setMainDashboard(
      state,
      action: PayloadAction<{
        dashboardId: string;
      }>,
    ) {
      const {
        payload: { dashboardId },
      } = action;
      const dashboard = state.dashboards.get(dashboardId);
      if (!dashboard) return;
      // set all dashboards to non-main
      Array.from(state.dashboards.keys()).forEach(dId => {
        const dashboard = state.dashboards.get(dId);
        if (!dashboard) return;
        state.dashboards.set(dId, {
          ...dashboard,
          isMainDashboard: false,
        });
      });
      // Set new main dashboard
      state.dashboards.set(dashboardId, {
        ...dashboard,
        isMainDashboard: true,
      });
    },
    addSharedDashboard(
      state,
      action: PayloadAction<{
        name: string;
        visualisations: ConfiguredVisualisation[];
      }>,
    ) {
      const {
        payload: { name, visualisations },
      } = action;
      const dashboardId = uuidv4();
      if (state.dashboards.has(dashboardId)) return;
      // Add new dashbaord
      state.dashboards.set(dashboardId, {
        name,
        isMainDashboard: false,
        visualisations,
      });
    },
  },
});

export const { actions: globalActions, reducer } = slice;

export const useGlobalSlice = () => {
  useInjectReducer({ key: slice.name, reducer: slice.reducer });
  useInjectSaga({ key: slice.name, saga: globalSaga });
  return { actions: slice.actions };
};
