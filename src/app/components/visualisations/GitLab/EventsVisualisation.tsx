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
import { useSelector } from 'react-redux';
import { selectProjects } from 'app/data/gitLabSlice/selectors';

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
  const projects = useSelector(selectProjects);
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
          const project = projects.find(
            project => project.id === item.project_id,
          );
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
          const card = (
            <CardWrapper key={`eventCard ${item.id}`}>
              <div className="float-left">
                <GitLabUser user={item.author} imgOnly iconProps={iconProps} />
              </div>
              <div className="container">
                <div className="float-right">
                  <span>{moment(item.created_at).fromNow()}</span>
                </div>
                <div className="content">
                  {item.author.name} {item.action_name}{' '}
                  {item.target_type || item.push_data?.ref_type || undefined}{' '}
                  <div className="gray">
                    {item.target_title ||
                      item.push_data?.ref ||
                      item.push_data?.commit_title}
                  </div>
                  {project && (
                    <>
                      {' in '}
                      {project.name}
                    </>
                  )}
                </div>
              </div>
            </CardWrapper>
          );
          if (project && project.web_url) {
            return (
              <UnstyledA
                key={`eventCard ${item.id} a`}
                href={project.web_url}
                target="_blank"
                rel="noreferrer"
              >
                {card}
              </UnstyledA>
            );
          } else {
            return card;
          }
        })}
      </Wrapper>
    </VisualisationContainer>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-flow: column;
`;

const UnstyledA = styled.a`
  color: inherit;
  text-decoration: inherit;
  &:hover {
    color: inherit;
  }
`;

const CardWrapper = styled.div`
  display: flex;
  flex-flow: row;
  background: rgba(0, 0, 0, 0.1);
  margin: 0.5em 1em;
  border-radius: 0.5em;
  color: var(--clr-white);
  overflow-wrap: anywhere;

  :hover {
    background: rgba(0, 0, 0, 0.05);
  }

  .gray {
    display: inline !important;
    color: var(--clr-gray);
  }

  .container {
    display: flex;
    flex-flow: column;
    padding: 1em;
  }

  .flex-row {
    display: flex;
    flex-flow: column;
    width: 100%;
    height: 100%;
    align-items: flex-start;
    justify-content: space-between;
  }

  .float-left {
    display: flex;
    padding: 1em 0.5em 1em 1em;
    border-right: 3px solid rgba(0, 0, 0, 0.1);
    justify-content: center;
    align-items: center;
  }

  .float-right {
    display: flex;
    flex-flow: row;
    justify-content: end;
    span {
      min-width: 3em;
      color: var(--clr-gray);
    }
  }

  .content {
    display: inline;
  }
`;

export default compose<ComponentType<PropTypes>>(
  withGitLabConfiguredCheck,
  withGroupFieldsProvider,
  withWidgetConfigurationModal(),
  withEventsLoadingByGroup,
)(EventsVisualisation);
