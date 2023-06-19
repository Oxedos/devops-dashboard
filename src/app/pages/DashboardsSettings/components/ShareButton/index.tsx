import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { BlueButton } from 'app/components/Design/Buttons';
import { Dashboard } from 'app/data/globalSlice/types';
import React, { useState } from 'react';
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
    <BlueButton onClick={() => setModalOpen(true)}>
      <FontAwesomeIcon icon="share-square" />
    </BlueButton>
  );

  return (
    <>
      {modal}
      {shareButton}
    </>
  );
};

export default ShareButton;
