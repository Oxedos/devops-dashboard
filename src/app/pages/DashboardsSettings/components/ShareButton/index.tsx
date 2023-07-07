import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Dashboard } from 'app/data/globalSlice/types';
import ShareModal from '../ShareModal';

type ShareButtonPropTypes = {
  dashboardId: string;
  dashboard: Dashboard;
};

const ShareButton: React.FC<ShareButtonPropTypes> = props => {
  const { dashboardId, dashboard } = props;
  const [isModalOpen, setModalOpen] = useState(false);

  const modal = (
    <ShareModal
      show={isModalOpen}
      onHide={() => setModalOpen(false)}
      dashboardId={dashboardId}
      dashboard={dashboard}
    />
  );

  const shareButton = (
    <Button onClick={() => setModalOpen(true)}>
      <FontAwesomeIcon icon="share-square" />
    </Button>
  );

  return (
    <>
      {modal}
      {shareButton}
    </>
  );
};

export default ShareButton;
