import { lazyLoad } from 'utils/loadable';

export const Whitesource = lazyLoad(
  () => import('./index'),
  module => module.Whitesource,
);
