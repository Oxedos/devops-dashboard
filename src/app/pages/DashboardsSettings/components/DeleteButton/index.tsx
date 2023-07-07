import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { globalActions } from 'app';
import {
  ConfiguredVisualisation,
  getAfterVisualisationRemovedActions,
} from 'app/data/VisualisationTypes';
import { Dashboard } from 'app/data/globalSlice/types';

type DeleteButtonPropTypes = {
  dashboardId: string;
  dashboard: Dashboard;
  isLastDashboard: boolean;
};

const DeleteButton: React.FC<DeleteButtonPropTypes> = props => {
  const { dashboardId, dashboard, isLastDashboard } = props;
  const dispatch = useDispatch();
  const [isModalOpen, setModalOpen] = useState(false);

  if (isLastDashboard || dashboard.isMainDashboard) {
    return null;
  }

  const deleteDashboard = dashboardId => {
    // Call afterDeleteActions for all visualisations
    // This ensures the visualisations on the dashboard are properly removed
    dashboard.visualisations
      .map((vis: ConfiguredVisualisation) =>
        getAfterVisualisationRemovedActions(vis.type, vis.id, vis.props),
      )
      .flat()
      .forEach(action => dispatch(action));
    dispatch(globalActions.removeDashboard({ dashboardId }));
  };

  return (
    <>
      <Button
        onClick={() => setModalOpen(true)}
        className="mr-3"
        variant="danger"
      >
        <FontAwesomeIcon icon="trash" />
      </Button>
      <Modal show={isModalOpen} centered onHide={() => setModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Dashboard</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure, that you want to permanently delete the Dashboard "
          {dashboard.name}"? This action cannot be undone!
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => deleteDashboard(dashboardId)} variant="danger">
            Permanently Delete Dashboard
          </Button>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default DeleteButton;
