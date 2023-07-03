import { createManager } from 'redux-injectors';
import * as GlobalSlice from 'app/data/globalSlice';
import * as RssSlice from 'app/data/rssSlice';
import * as WhitesourceSlice from 'app/data/whitesourceSlice';
import * as GitlabSlice from 'app/data/gitLabSlice';

export const GlobalSliceManager = createManager({
  name: 'GlobalSliceManager',
  key: GlobalSlice.name,
  reducer: GlobalSlice.reducer,
  saga: GlobalSlice.saga,
});

export const RssSliceManager = createManager({
  name: 'RssSliceManager',
  key: RssSlice.name,
  reducer: RssSlice.reducer,
  saga: RssSlice.saga,
});

export const WhitesourceSliceManager = createManager({
  name: 'WhitesourceSliceManager',
  key: WhitesourceSlice.name,
  reducer: WhitesourceSlice.reducer,
  saga: WhitesourceSlice.saga,
});

export const GitlabSliceManager = createManager({
  name: 'GitlabSliceManager',
  key: GitlabSlice.name,
  reducer: GitlabSlice.reducer,
  saga: GitlabSlice.saga,
});
