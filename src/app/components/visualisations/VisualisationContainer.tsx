import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { globalActions } from 'app';
import {
  getDashbaordId,
  selectDashboards,
} from 'app/data/globalSlice/selectors';
import { GlobalColours } from 'styles/global-styles';

type PropTypes = {
  id: string;
  title?: string;
  onSettingsClick: Function;
  afterVisRemoved: Function;
};

const VisualisationContainer: React.FC<
  React.PropsWithChildren<PropTypes>
> = props => {
  const dispatch = useDispatch();
  // Find current visualisation
  const { dashboardId }: any = useParams();
  const dashboards = useSelector(selectDashboards);
  const dId = getDashbaordId(dashboards, dashboardId) || '';
  const visualisations = dashboards.get(dId)?.visualisations || [];
  const vis = visualisations.find(v => v.id === props.id);
  // Check if a title override was specified
  const overrideTitle = vis?.props?.title;

  return (
    <Wrapper>
      <HandleRow>
        {props.onSettingsClick ? (
          <SettingsIcon
            className="fadeIcon"
            icon="cog"
            size="xs"
            color={GlobalColours.blue}
            onClick={() => props.onSettingsClick && props.onSettingsClick()}
          />
        ) : (
          <PH />
        )}
        <Handle className="visContainerDraggableHandle">
          <p>{overrideTitle || props.title}</p>
          <Dot className="dot" />
          <Dot className="dot" />
          <Dot className="dot" />
        </Handle>
        <CloseIcon
          className="fadeIcon"
          icon="times"
          size="xs"
          color={GlobalColours.red}
          onClick={() => {
            dispatch(globalActions.removeVisualisation(props.id));
            if (props.afterVisRemoved) {
              props.afterVisRemoved();
            }
          }}
        />
      </HandleRow>
      <ButtonGroup></ButtonGroup>
      <BodyContainer>{props.children}</BodyContainer>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  background: var(--clr-widget);
  border-radius: 0.5em;
  min-height: 100%;
  max-height: 100%;
  max-width: 100%;
  height: 100%;
  overflow: auto;
  display: flex;
  flex-flow: column;
  position: relative;
  &:hover .fadeIcon {
    opacity: 1;
    transition: opacity 0.25s ease-in-out;
  }
`;

const PH = styled.div`
  width: 8.25px;
  height: 1px;
  margin-top: 0.15em;
  margin-right: 0.5em;
`;

const ButtonGroup = styled.div`
  position: absolute;
  top: 1em;
  left: 25%;
  right: 25%;
  display: flex;
  flex-flow: row;
  align-items: center;
  justify-content: space-evenly;
`;

const CloseIcon = styled(FontAwesomeIcon)`
  margin-top: 0.15em;
  margin-left: 0.5em;
  opacity: 0;
  cursor: pointer;
  &:hover {
    color: var(--clr-red);
  }
`;

const SettingsIcon = styled(FontAwesomeIcon)`
  opacity: 0;
  margin-top: 0.15em;
  margin-right: 0.5em;
  cursor: pointer;
  &:hover {
    color: var(--clr-blue);
  }
`;

const HandleRow = styled.div`
  display: flex;
  flex-flow: row;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 0.75em;
`;

const Handle = styled.div`
  background: var(--clr-dark-gray);
  width: 50%;
  max-width: 20em;
  height: 100%;
  border-radius: 0 0 1em 1em;
  display: flex;
  flex-flow: row;
  align-items: center;
  justify-content: center;
  padding: 0 1em;
  cursor: grab;
  & .dot + .dot {
    margin-left: 1em;
  }

  .dot {
    display: none;
  }
  &:hover .dot {
    display: unset;
  }

  p {
    font-family: sans-serif;
    padding: 0;
    margin: 0;
    font-size: 0.75rem;
    white-space: nowrap;
    overflow: hidden;
  }

  &:hover p {
    display: none;
  }
`;

const Dot = styled.div`
  height: 5px;
  width: 5px;
  background-color: var(--clr-gray);
  border-radius: 50%;
`;

const BodyContainer = styled.div`
  padding: 0;
  flex-grow: 2;
  display: flex;
  flex-flow: column;
  overflow-y: auto;
  > * {
    flex-grow: 2;
  }
`;

export default VisualisationContainer;
