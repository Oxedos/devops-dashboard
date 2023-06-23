import React, { ComponentType } from 'react';
import { useSelector } from 'react-redux';
import SimpleMessage from '../../components/SimpleMessage';
import compose from 'app/components/compose';
import { selectFeeds } from 'app/data/rssSlice/selectors';
import withFieldProvider from '../components/withFieldProvider';
import withUrlConfiguredCheck from '../components/withUrlConfiguredCheck';
import VisualisationContainer from '../../components/VisualisationContainer';
import styled from 'styled-components/macro';
import Figure from 'react-bootstrap/Figure';
import moment from 'moment';
import withWidgetConfigurationModal from '../../components/withWidgetConfigurationModal';

type OuterPropTypes = {
  id: string;
  compactView?: boolean;
};

type InnerPropTypes = {
  onSettingsClick: Function;
  afterVisRemoved: Function;
} & OuterPropTypes;

const htmlContent = s => {
  if (!s) return undefined;
  var span = document.createElement('span');
  span.innerHTML = s;
  return span.textContent || span.innerText;
};

const RssFeedVisualisation: React.FC<InnerPropTypes> = props => {
  const feeds = useSelector(selectFeeds);
  const configuredFeed = feeds.get(props.id);
  const title = 'RSS Feed';

  if (!configuredFeed) {
    return (
      <SimpleMessage
        id={props.id}
        onSettingsClick={props.onSettingsClick}
        afterVisRemoved={props.afterVisRemoved}
        title={title}
        message="Widget not configured"
      />
    );
  }

  if (configuredFeed.error) {
    return (
      <SimpleMessage
        id={props.id}
        onSettingsClick={props.onSettingsClick}
        afterVisRemoved={props.afterVisRemoved}
        title={title}
        message={configuredFeed.error}
      />
    );
  }

  if (
    !configuredFeed.feed ||
    !configuredFeed.feed.items ||
    configuredFeed.feed.items.length <= 0
  ) {
    return (
      <SimpleMessage
        id={props.id}
        onSettingsClick={props.onSettingsClick}
        afterVisRemoved={props.afterVisRemoved}
        title={title}
        message="No Information to Display"
      />
    );
  }

  return (
    <VisualisationContainer
      id={props.id}
      title={configuredFeed.feed.title}
      onSettingsClick={props.onSettingsClick}
      afterVisRemoved={props.afterVisRemoved}
    >
      <Wrapper>
        {configuredFeed.feed.items.map((item, idx) => {
          const onClick = item.link ? () => window.open(item.link) : () => {};
          const content =
            item.contentSnippet ||
            htmlContent(item.content) ||
            item.summarySnippet ||
            htmlContent(item.summary);
          return (
            <CardWrapper
              key={`${idx}-${item.contentSnippet || item.summary}`}
              style={{ cursor: item.link ? 'pointer' : 'unset' }}
              onClick={() => onClick()}
            >
              <div className="flex-row">
                {item.thumbnail?.$?.url && (
                  <div className="thumbnail">
                    <StyledFigure>
                      <Figure.Image src={item.thumbnail?.$.url || ''} />
                    </StyledFigure>
                  </div>
                )}
                <div className="flex-column">
                  <div className="flex-row">
                    <strong>{item.author}</strong>
                    <span>{moment(item.pubDate).fromNow()}</span>
                  </div>
                  <p className="title">{htmlContent(item.title)}</p>
                </div>
              </div>
              {!props.compactView && content && (
                <div className="content">{content}</div>
              )}
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
  flex-flow: column;
  align-items: center;
  justify-content: space-between;
  gap: 1em;
  background: rgba(0, 0, 0, 0.1);
  margin: 0.5em 1em;
  padding: 1em;
  border-radius: 0.5em;
  cursor: pointer;

  :hover {
    background: rgba(0, 0, 0, 0.05);
  }

  p {
    font-family: Arial, Helvetica, sans-serif;
    padding: 0;
    margin: 0;
  }

  .flex-row {
    display: flex;
    flex-flow: row;
    width: 100%;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1em;
  }

  .flex-column {
    display: flex;
    flex-flow: row;
    width: 100%;
    align-items: center;
    justify-content: space-between;
  }

  .title {
    width: 100%;
  }

  .thumbnail {
    min-width: 2em;
    max-width: 2em;
  }

  .content {
    width: 100%;
    font-style: italic;
    padding-left: 1em;
    border-left: 5px solid rgba(0, 0, 0, 0.1);
  }
`;

const StyledFigure = styled(Figure)`
  padding: 0;
  img {
    border-radius: 50%;
    margin: 0;
    padding: 0;
    width: 2em;
    height: 2em;
  }
`;

export default compose<ComponentType<OuterPropTypes>>(
  withFieldProvider,
  withWidgetConfigurationModal(),
  withUrlConfiguredCheck,
)(RssFeedVisualisation);
