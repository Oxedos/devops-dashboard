import { RssFeed } from 'app/apis/rss/types';

export type ConfiguredFeed = {
  corsRelayUrl: string | undefined;
  url: string;
  error: string | undefined;
  feed: RssFeed | undefined;
  basicAuthEncoded: string | undefined;
  corsRelayApiKey: string | undefined;
};

export interface RssState {
  feeds: Map<string, ConfiguredFeed>;
}
