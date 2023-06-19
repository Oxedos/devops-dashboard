import React, { memo } from 'react';
import styled from 'styled-components/macro';
import VisualisationContainer from '../VisualisationContainer';

type PropTypes = {
  onSettingsClick?: Function;
  afterVisRemove?: Function;
  id: string;
  title: string;
  message: string;
};

const SimpleMessage: React.FC<PropTypes> = props => {
  return (
    <VisualisationContainer
      onSettingsClick={props.onSettingsClick}
      afterVisRemove={props.afterVisRemove}
      id={props.id}
      title={props.title}
    >
      <MessageWrapper>{props.message}</MessageWrapper>
    </VisualisationContainer>
  );
};

const MessageWrapper = styled.div`
  font-weight: bold;
  display: flex;
  flex-flow: column;
  align-items: center;
  justify-content: space-around;
  text-align: center;
`;

export default memo(SimpleMessage);
