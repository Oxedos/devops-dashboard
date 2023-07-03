import * as Effects from 'redux-saga/effects';
import { LOCALSTORAGE_KEY } from '.';
import { globalActions, rssActions } from 'app';
import * as API from 'app/apis/rss';
import * as PersistanceAPI from 'app/apis/persistance';
import { fork } from 'redux-saga/effects';
import { selectFeeds, selectRss } from './selectors';
import { ConfiguredFeed } from './types';
import { RssFeed } from 'app/apis/rss/types';

const { select, call, put, delay } = Effects;
const takeLatest: any = Effects.takeLatest;

function* loadFeeds() {
  const feeds: Map<string, ConfiguredFeed> = yield select(selectFeeds);
  const visIds = Array.from(feeds.keys());

  if (!visIds || visIds.length <= 0) return;

  const loadingId = '[RSS] loadFeeds';
  yield put(globalActions.addLoader({ id: loadingId }));

  for (const visId of visIds) {
    try {
      const feed: RssFeed = yield call(
        API.getRssFeed,
        feeds.get(visId)?.url || '',
        feeds.get(visId)?.basicAuthEncoded || undefined,
        feeds.get(visId)?.corsRelayUrl || undefined,
        feeds.get(visId)?.corsRelayApiKey || undefined,
      );
      // only save the 20 latest elements
      feed.items = feed.items.slice(0, 20);
      yield put(rssActions.addFeedInfo({ visId, error: undefined, feed }));
    } catch (error) {
      if (error instanceof Error) {
        yield put(
          rssActions.addFeedInfo({
            visId,
            error: error.message,
            feed: undefined,
          }),
        );
      } else {
        yield put(
          rssActions.addFeedInfo({
            visId,
            error: 'Unknown Error',
            feed: undefined,
          }),
        );
      }
    }
  }

  yield put(globalActions.removeLoader({ id: loadingId }));
}

function* pollShort() {
  while (true) {
    const feeds: Map<string, ConfiguredFeed> = yield select(selectFeeds);
    const visIds = Array.from(feeds.keys());
    if (visIds && visIds.length > 0) {
      yield call(loadFeeds);
      yield call(persist);
    }
    yield delay(1000 * 60); // every minute
  }
}

function* persist() {
  const state = yield select(selectRss);
  yield call(PersistanceAPI.saveToLocalStorage, LOCALSTORAGE_KEY, state);
}

function* loadAll() {
  const feeds: Map<string, ConfiguredFeed> = yield select(selectFeeds);
  const visIds = Array.from(feeds.keys());
  if (!visIds || visIds.length <= 0) return;
  yield call(loadFeeds);
  yield call(persist);
}

export function* rssSaga() {
  yield takeLatest(rssActions.deleteConfiguration.type, persist);
  yield takeLatest(rssActions.reload.type, loadAll);
  yield takeLatest(rssActions.addFeed.type, loadAll);
  yield takeLatest(rssActions.removeFeed.type, persist);
  yield fork(pollShort);
}
