import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components/macro';
import { useGlobalSlice } from 'app/data/globalSlice';
import Modal from 'react-bootstrap/Modal';
import { GroupIcons, VisualisationType } from 'app/data/VisualisationTypes';
import { v4 as uuidv4 } from 'uuid';
import { AllVisualisations } from 'app/data/VisualisationTypes';
import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useParams } from 'react-router';
import {
  getDashbaordId,
  selectDashboards,
} from 'app/data/globalSlice/selectors';

type propTypes = {
  show: boolean;
  onHide: () => void;
};

export default function AddVisualisationModal(props: propTypes) {
  const { actions: globalActions } = useGlobalSlice();
  const [selectedGroup, setSelectedGroup] = useState<string | undefined>(
    undefined,
  );
  const dispatch = useDispatch();
  const { dashboardId }: any = useParams();
  const dashboards = useSelector(selectDashboards);

  const addVis = (type: VisualisationType) => {
    const dId = getDashbaordId(dashboards, dashboardId);
    if (!dId) return;
    dispatch(
      globalActions.addVisualisation({
        dashboardId: dId,
        type,
        id: uuidv4(),
      }),
    );
    props.onHide();
  };

  const groups = [...new Set(AllVisualisations.map(vis => vis.group))];
  const AnyIcon: any = FontAwesomeIcon; // Because we're using a custom icon

  return (
    <Modal show={props.show} centered onHide={props.onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Add Widget</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <ButtonWrapper>
          {selectedGroup ? (
            <GroupWrapper>
              <Title>
                <FontAwesomeIcon icon={GroupIcons[selectedGroup]} size="2x" />
                <span>{selectedGroup}</span>
              </Title>
              <ButtonGroup>
                {AllVisualisations.filter(
                  vis => vis.group === selectedGroup,
                ).map(vis => (
                  <FlexChild key={vis.label}>
                    <BigButton onClick={() => addVis(vis.type)}>
                      <AnyIcon icon={vis.icon} size="2x" />
                      <span>{vis.label}</span>
                    </BigButton>
                  </FlexChild>
                ))}
              </ButtonGroup>
              <hr />
              <Button onClick={() => setSelectedGroup(undefined)}>Back</Button>
            </GroupWrapper>
          ) : (
            <ButtonGroup>
              {groups.map(group => (
                <FlexChild key={group}>
                  <BigButton onClick={() => setSelectedGroup(group)}>
                    <FontAwesomeIcon icon={GroupIcons[group]} size="3x" />
                    <span>{group}</span>
                  </BigButton>
                </FlexChild>
              ))}
            </ButtonGroup>
          )}
        </ButtonWrapper>
      </Modal.Body>
    </Modal>
  );
}

const ButtonWrapper = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: space-around;
`;

const GroupWrapper = styled.div`
  width: 100%;
  margin-bottom: 1em;
`;

const Title = styled.div`
  margin-bottom: 1em;
  span {
    text-transform: capitalize;
    margin-left: 1em;
    font-size: 1.5em;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  width: 100%;
`;

const FlexChild = styled.div`
  flex: 1 0 50%;
  display: flex;
  align-items: center;
  justify-content: space-around;
`;

const BigButton = styled.div`
  display: flex;
  flex-flow: column;
  align-items: center;
  padding: 0.5em;
  justify-content: space-between;
  width: 8em;
  height: 8em;
  background: var(--clr-background);
  border-radius: 0.5em;
  margin-bottom: 2em;
  cursor: pointer;
  user-select: none;

  :hover {
    background: rgba(0, 0, 0, 0.1);
  }

  span {
    font-size: 1.1em;
    text-transform: capitalize;
    text-align: center;
  }
`;
