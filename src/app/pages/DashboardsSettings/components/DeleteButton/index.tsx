import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { BlueButton, RedButton } from 'app/components/Design/Buttons';
import DarkModal from 'app/components/Design/DarkModal';
import { globalActions } from 'app/data/globalSlice';
import { Dashboard } from 'app/data/globalSlice/types';
import {
  ConfiguredVisualisation,
  getAfterVisualisationRemovedActions,
} from 'app/data/VisualisationTypes';
import React, { useState } from 'react';
import Modal from 'react-bootstrap/esm/Modal';
import { useDispatch } from 'react-redux';

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
      <RedButton onClick={() => setModalOpen(true)} className="mr-3">
        <FontAwesomeIcon icon="trash" />
      </RedButton>
      <DarkModal show={isModalOpen} centered onHide={() => setModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Dashboard</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure, that you want to permanently delete the Dashboard "
          {dashboard.name}"? This action cannot be undone!
        </Modal.Body>
        <Modal.Footer>
          <RedButton onClick={() => deleteDashboard(dashboardId)}>
            Permanently Delete Dashboard
          </RedButton>
          <BlueButton onClick={() => setModalOpen(false)}>Cancel</BlueButton>
        </Modal.Footer>
      </DarkModal>
    </>
  );
};

export default DeleteButton;
