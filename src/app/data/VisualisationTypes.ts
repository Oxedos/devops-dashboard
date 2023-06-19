import { gitLabActions } from './gitLabSlice';
import { globalActions } from './globalSlice';
import { rssActions } from './rssSlice';

// Do note remove enums!
// The order number of each enum is important!
export enum VisualisationType {
  GITLAB_MR_OPEN_METRIC,
  GITLAB_ISSUES_OPEN_METRIC,
  GITLAB_READY_MR_TABLE,
  GITLAB_MR_ASSIGNED_TABLE,
  DP_1, // Deprecated
  DP_2, // Deprecated
  GITLAB_PIPELINES_TABLE,
  DP_3, // Deprecated
  DP_4, // Deprecated
  WS_VULNERABILITIES_TABLE,
  DP_5, // Deprecated
  DP_6, // Deprecated
  DP_7, // Deprecated
  DP_8, // Deprecated
  RSS_FEED_VISUALISATION,
  WS_VULNERABLE_SERVICES_TABLE,
  WS_VULNERABLE_DEPENDENCIES_TABLE,
}

/**
 * Collection of handlers to call after a visualisation was updated
 * @param type The type of visualisation that was updated
 * @param visId The id of the visualisation that was updated
 * @param props The props the visualisation got
 * @returns A list of actions to dispatch
 */
export const getAfterVisualisationUpdatedActions = (
  type: VisualisationType,
  visId: string,
  props: any,
) => {
  switch (type) {
    case VisualisationType.GITLAB_MR_OPEN_METRIC:
    case VisualisationType.GITLAB_ISSUES_OPEN_METRIC:
    case VisualisationType.GITLAB_READY_MR_TABLE:
    case VisualisationType.GITLAB_MR_ASSIGNED_TABLE:
      return [
        gitLabActions.addListenedGroup({
          groupName: props.group,
          visId,
        }),
      ];
    case VisualisationType.GITLAB_PIPELINES_TABLE:
      return [
        gitLabActions.addListenedGroup({
          groupName: props.group,
          visId,
        }),
      ];
    case VisualisationType.RSS_FEED_VISUALISATION: {
      // update props to base64-encode username and password
      const basicAuthEncoded =
        props.username && props.password
          ? btoa(`${props.username}:${props.password}`)
          : undefined;
      const strippedNewProps = Object.assign({}, props);
      delete strippedNewProps.username; // do not persist username and password
      delete strippedNewProps.password;
      const updateVisProps = globalActions.setVisualisationProps({
        id: visId,
        props: {
          ...strippedNewProps,
          basicAuthEncoded,
        },
      });

      // Add the props information to the rssSlice
      const addRssFeed = rssActions.addFeed({
        visId,
        url: props.url,
        basicAuthEncoded,
        corsRelayUrl: props.corsRelayUrl,
        corsRelayApiKey: props.corsRelayApiKey,
      });

      return [updateVisProps, addRssFeed];
    }
    default: {
      return [];
    }
  }
};

/**
 * Collection of handlers to call after a visualisation was removed
 * @param type The type of visualisation that was updated
 * @param visId The id of the visualisation that was updated
 * @param props The props the visualisation got
 * @returns A list of actions to dispatch
 */
export const getAfterVisualisationRemovedActions = (
  type: VisualisationType,
  visId: string,
  props: any,
) => {
  switch (type) {
    case VisualisationType.GITLAB_PIPELINES_TABLE:
      return [
        gitLabActions.removeListenedGroup({
          visId,
          groupName: props.group,
        }),
      ];
    case VisualisationType.RSS_FEED_VISUALISATION:
      return [rssActions.removeFeed({ visId })];
    default: {
      return [];
    }
  }
};

export const getDefaultSize = (type: VisualisationType) => {
  switch (type) {
    case VisualisationType.GITLAB_MR_OPEN_METRIC:
      return {
        minW: 4,
        minH: 8,
        w: 4,
        h: 8,
      };
    case VisualisationType.GITLAB_PIPELINES_TABLE:
      return {
        minW: 5,
        minH: 5,
        w: 18,
        h: 5,
      };
    case VisualisationType.WS_VULNERABLE_SERVICES_TABLE:
    case VisualisationType.WS_VULNERABLE_DEPENDENCIES_TABLE:
    case VisualisationType.RSS_FEED_VISUALISATION:
    case VisualisationType.GITLAB_READY_MR_TABLE:
    case VisualisationType.GITLAB_MR_ASSIGNED_TABLE:
    case VisualisationType.WS_VULNERABILITIES_TABLE:
      return {
        minW: 1,
        minH: 1,
        w: 5,
        h: 14,
      };
    default:
      return {
        minW: 5,
        minH: 9,
        w: 6,
        h: 9,
      };
  }
};

export type ConfiguredVisualisation = {
  type: VisualisationType;
  id: string;
  props?: {
    [key: string]: any;
  };
  x: number;
  y: number;
  minW: number | undefined;
  minH: number | undefined;
  w: number;
  h: number;
};

export const GroupIcons = {
  gitlab: ['fab', 'gitlab'],
  openshift: ['fab', 'redhat'],
  whitesource: ['fab', 'atlassian'],
  RSS: 'rss-square',
};

/**
 * Used for creating the Add Widget Modal
 */
export const AllVisualisations = [
  {
    group: 'gitlab',
    icon: ['fab', 'metric'],
    type: VisualisationType.GITLAB_ISSUES_OPEN_METRIC,
    label: 'Open GitLab Issues',
  },
  {
    group: 'gitlab',
    icon: ['fab', 'metric'],
    type: VisualisationType.GITLAB_MR_OPEN_METRIC,
    label: 'Open Merge Requests',
  },
  {
    group: 'gitlab',
    icon: 'table',
    type: VisualisationType.GITLAB_READY_MR_TABLE,
    label: 'Ready MRs',
  },
  {
    group: 'gitlab',
    icon: 'table',
    type: VisualisationType.GITLAB_MR_ASSIGNED_TABLE,
    label: 'MRs Assigned to you',
  },
  {
    group: 'gitlab',
    icon: 'stream',
    type: VisualisationType.GITLAB_PIPELINES_TABLE,
    label: 'Pipelines',
  },
  {
    group: 'whitesource',
    icon: 'table',
    type: VisualisationType.WS_VULNERABILITIES_TABLE,
    label: 'Vulnerabilites',
  },
  {
    group: 'whitesource',
    icon: 'table',
    type: VisualisationType.WS_VULNERABLE_SERVICES_TABLE,
    label: 'Vulnerable Projects',
  },
  {
    group: 'whitesource',
    icon: 'table',
    type: VisualisationType.WS_VULNERABLE_DEPENDENCIES_TABLE,
    label: 'Vulnerable Dependencies',
  },
  {
    group: 'RSS',
    icon: 'stream',
    type: VisualisationType.RSS_FEED_VISUALISATION,
    label: 'RSS Feed',
  },
];
