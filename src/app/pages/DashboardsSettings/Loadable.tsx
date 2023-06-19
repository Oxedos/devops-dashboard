import { lazyLoad } from 'utils/loadable';

export const DashboardSettings = lazyLoad(
  () => import('./index'),
  module => module.DashboardSettings,
);
