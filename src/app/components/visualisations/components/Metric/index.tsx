import React, { FunctionComponent, memo } from 'react';
import styled from 'styled-components/macro';
import VisualisationContainer from 'app/components/visualisations/components/VisualisationContainer';

type PropTypes = {
  id: string;
  title: string;
  label: string;
  value: any;
  onSettingsClick?: Function;
  onBodyClick?: Function;
};

const Metric: FunctionComponent<PropTypes> = props => {
  const BodyWrapper = props.onBodyClick ? ClickableWrapper : Wrapper;
  const clickFunction = props.onBodyClick ? props.onBodyClick : () => {};
  return (
    <VisualisationContainer
      onSettingsClick={props.onSettingsClick}
      id={props.id}
      title={props.title}
    >
      <BodyWrapper onClick={() => clickFunction()}>
        <ValueWraper>{props.value}</ValueWraper>
        <LabelWrapper>{props.label}</LabelWrapper>
      </BodyWrapper>
    </VisualisationContainer>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: space-evenly;
`;

const ClickableWrapper = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: space-evenly;
  cursor: pointer;
  &:hover {
    background: rgba(0, 0, 0, 0.2);
  }
`;

const ValueWraper = styled.div`
  font-weight: bold;
  font-size: 5em;
`;

const LabelWrapper = styled.div`
  font-size: 2em;
  text-align: center;
`;

export default memo(Metric);
