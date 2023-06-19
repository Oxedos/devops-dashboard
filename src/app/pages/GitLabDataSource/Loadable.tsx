import { lazyLoad } from 'utils/loadable';

export const GitLabDataSource = lazyLoad(
  () => import('./index'),
  module => module.GitLabDataSource,
);
