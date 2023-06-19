import Parser from 'rss-parser';
import { RssFeed } from './types';

const getHost = url => {
  const parser = document.createElement('a');
  parser.href = url;
  return parser.host;
};

const makeHostCorrect = (incorrectUrl, correctBaseUrl) => {
  const parser = document.createElement('a');
  parser.href = incorrectUrl;
  parser.host = getHost(correctBaseUrl);
  return parser.href;
};

export async function getRssFeed(
  url: string,
  basicAuthEncoded?: string,
  corsRelayUrl?: string,
  corsRelayApiKey?: string,
): Promise<RssFeed> {
  try {
    let headers: any = undefined;
    if (basicAuthEncoded || corsRelayApiKey) {
      headers = {
        Authorization: basicAuthEncoded
          ? `Basic ${basicAuthEncoded}`
          : undefined,
        apikey: corsRelayApiKey ? corsRelayApiKey : undefined,
      };
    }
    const parser = new Parser({
      headers,
      customFields: {
        item: [['media:thumbnail', 'thumbnail']],
      },
    });
    const fullUrl = corsRelayUrl
      ? `${corsRelayUrl}/${encodeURIComponent(url)}`
      : url;
    const feed: any = await parser.parseURL(fullUrl);
    if (corsRelayUrl) {
      // update links in feed as they have the incorrect host
      feed.link = url;
      if (feed.items && Array.isArray(feed.items)) {
        feed.items = feed.items.map(item => {
          if (item.thumbnail?.$?.url) {
            item.thumbnail.$.url = makeHostCorrect(item.thumbnail.$.url, url);
          }
          if (item.link) {
            item.link = makeHostCorrect(item.link, url);
          }
          return item;
        });
      }
    }
    return feed;
  } catch (error) {
    throw error;
  }
}
