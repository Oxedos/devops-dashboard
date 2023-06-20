import { GitLabEvent } from 'app/apis/gitlab/types';
import compose from 'app/components/compose';
import React, { ComponentType } from 'react';
import withWidgetConfigurationModal from '../components/withWidgetConfigurationModal';
import withEventsLoadingByGroup from './components/withEventsLoadingByGroup';
import withGitLabConfiguredCheck from './components/withGitLabConfiguredCheck';
import withGroupFieldsProvider from './components/withGroupFieldsProvider';
import VisualisationContainer from '../components/VisualisationContainer';
import styled from 'styled-components/macro';
import moment from 'moment';
import GitLabUser from 'app/components/GitLab/GitLabUser';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { GlobalColours } from 'styles/global-styles';

type PropTypes = {
  id: string;
  onSettingsClick?: Function;
  afterVisRemove?: Function;
};

type PropTypesAfterHoc = {
  group: string;
  events: (GitLabEvent | undefined)[];
} & PropTypes;

const getIcon = (
  actionName: string,
  target: string | undefined,
): { color: string; icon: IconProp } => {
  if (actionName === 'deleted') {
    return { color: GlobalColours.red, icon: 'trash' };
  }
  if (actionName === 'accepted') {
    return { color: GlobalColours.green, icon: 'check' };
  }
  if (actionName === 'pushed to' && target === 'branch') {
    return { color: GlobalColours.white, icon: 'code-merge' };
  }
  if (actionName === 'opened' && target === 'MergeRequest') {
    return { color: GlobalColours.white, icon: 'code-pull-request' };
  }
  if (actionName === 'pushed new' && target === 'branch') {
    return { color: GlobalColours.white, icon: 'code-branch' };
  }
  return { color: GlobalColours.gray, icon: 'circle' };
};

const EventsVisualisation: React.FC<PropTypesAfterHoc> = props => {
  return (
    <VisualisationContainer
      id={props.id}
      title={`Events in ${props.group}`}
      onSettingsClick={props.onSettingsClick}
      afterVisRemove={props.afterVisRemove}
    >
      <Wrapper>
        {props.events.map((item, idx) => {
          if (!item) {
            return null;
          }
          let content: (string | undefined)[] = [item.author.name];
          content.push(item.action_name);
          content.push(
            item.target_type || item.push_data?.ref_type || undefined,
          );
          content.push(
            item.target_title ||
              item.push_data?.ref ||
              item.push_data?.commit_title ||
              'missing info',
          );
          content = content.filter(item => !!item);
          const iconProps = getIcon(
            item.action_name,
            item.target_type || item.push_data?.ref_type || undefined,
          );
          return (
            <CardWrapper key={`eventCard ${item.id}`}>
              <div className="flex-row">
                <div className="float-left">
                  <GitLabUser
                    user={item.author}
                    imgOnly
                    iconProps={iconProps}
                  />
                </div>
                <div className="content">{content.join(' ')}</div>
                <div className="float-right">
                  <span>{moment(item.created_at).fromNow()}</span>
                </div>
              </div>
            </CardWrapper>
          );
        })}
      </Wrapper>
    </VisualisationContainer>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-flow: column;
`;

const CardWrapper = styled.div`
  display: flex;
  flex-flow: row;
  background: rgba(0, 0, 0, 0.1);
  margin: 0.5em 1em;
  border-radius: 0.5em;
  color: var(--clr-white);

  :hover {
    background: rgba(0, 0, 0, 0.05);
  }

  .flex-row {
    display: flex;
    flex-flow: row;
    width: 100%;
    align-items: flex-start;
    justify-content: space-between;
  }

  .float-left {
    display: flex;
    flex-flow: row;
    height: 100%;
    padding: 1em;
    border-right: 3px solid rgba(0, 0, 0, 0.1);
    justify-content: start;
    align-items: center;
  }

  .float-right {
    display: flex;
    flex-flow: row;
    justify-content: end;
    padding: 1em;
    span {
      white-space: nowrap;
      color: var(--clr-gray);
    }
  }

  .content {
    display: flex;
    flex-flow: row;
    justify-content: start;
    align-items: center;
    width: 100%;
    height: 100%;
    padding: 1em;
  }
`;

export default compose<ComponentType<PropTypes>>(
  withGitLabConfiguredCheck,
  withGroupFieldsProvider,
  withWidgetConfigurationModal(),
  withEventsLoadingByGroup,
)(EventsVisualisation);
