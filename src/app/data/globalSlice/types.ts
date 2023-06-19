import { ConfiguredVisualisation } from '../VisualisationTypes';

export enum NotificationType {
  error,
  warning,
  info,
}

export type Notification = {
  id: string;
  type: NotificationType;
  time: string;
  message: string;
};

export type Dashboard = {
  name: string;
  isMainDashboard: boolean;
  visualisations: ConfiguredVisualisation[];
};

export interface GlobalState {
  loaders: string[];
  notifications: Notification[];
  dashboards: Map<string, Dashboard>;
}
