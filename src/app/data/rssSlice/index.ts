import { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from 'utils/@reduxjs/toolkit';
import { rssSaga } from './saga';
import * as PersistanceAPI from 'app/apis/persistance';
import { RssState } from './types';
import { RssFeed } from 'app/apis/rss/types';

export const LOCALSTORAGE_KEY = 'rss_state';

const loadInitialState = (): RssState => {
  const persistedState: RssState =
    PersistanceAPI.loadFromLocalStorage(LOCALSTORAGE_KEY);
  return {
    feeds: persistedState?.feeds || new Map(),
  };
};

export const initialState = loadInitialState();

const slice = createSlice({
  name: 'rss',
  initialState,
  reducers: {
    addFeed(
      state,
      action: PayloadAction<{
        visId: string;
        url: string;
        corsRelayUrl: string | undefined;
        basicAuthEncoded?: string | undefined;
        corsRelayApiKey?: string | undefined;
      }>,
    ) {
      const {
        payload: {
          visId,
          url,
          basicAuthEncoded,
          corsRelayUrl,
          corsRelayApiKey,
        },
      } = action;
      state.feeds.set(visId, {
        url,
        corsRelayUrl,
        error: undefined,
        feed: undefined,
        basicAuthEncoded,
        corsRelayApiKey,
      });
    },
    removeFeed(state, action: PayloadAction<{ visId: string }>) {
      const {
        payload: { visId },
      } = action;
      state.feeds.delete(visId);
    },
    addFeedInfo(
      state,
      action: PayloadAction<{
        visId: string;
        error: string | undefined;
        feed: RssFeed | undefined;
      }>,
    ) {
      const {
        payload: { visId, error, feed },
      } = action;
      state.feeds.set(visId, {
        corsRelayUrl: state.feeds.get(visId)?.corsRelayUrl,
        url: state.feeds.get(visId)?.url || '',
        basicAuthEncoded: state.feeds.get(visId)?.basicAuthEncoded || '',
        corsRelayApiKey: state.feeds.get(visId)?.corsRelayApiKey || '',
        error,
        feed,
      });
    },
    reload(state, action: PayloadAction<void>) {},
    deleteConfiguration(state, action: PayloadAction<void>) {
      return {
        feeds: new Map(),
      };
    },
  },
});

export const name = slice.name;
export const { actions, reducer } = slice;
export const saga = rssSaga;
