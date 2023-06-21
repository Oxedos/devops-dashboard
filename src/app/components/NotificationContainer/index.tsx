import React from 'react';
import styled from 'styled-components/macro';
import Toast from 'react-bootstrap/Toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useDispatch, useSelector } from 'react-redux';
import { selectNotifications } from 'app/data/globalSlice/selectors';
import { Notification, NotificationType } from 'app/data/globalSlice/types';
import { useGlobalSlice } from 'app/data/globalSlice';
import { GlobalColours } from 'styles/global-styles';

const ErrorIcon = (
  <FontAwesomeIcon icon="exclamation-circle" color={GlobalColours.redLighter} />
);
const WarnIcon = (
  <FontAwesomeIcon icon="exclamation-triangle" color={GlobalColours.orange} />
);
const InfoIcon = (
  <FontAwesomeIcon icon="info-circle" color={GlobalColours.blue} />
);

const getIcon = (type: NotificationType) => {
  switch (type) {
    case NotificationType.error:
      return ErrorIcon;
    case NotificationType.warning:
      return WarnIcon;
    default:
    case NotificationType.info:
      return InfoIcon;
  }
};

const getTitle = (type: NotificationType) => {
  switch (type) {
    case NotificationType.error:
      return 'Error';
    case NotificationType.warning:
      return 'Warning';
    default:
    case NotificationType.info:
      return 'Info';
  }
};

type NotificationPropTypes = {
  notification: Notification;
};

const NotificationToast: React.FC<NotificationPropTypes> = props => {
  const dispatch = useDispatch();
  const { actions: globalActions } = useGlobalSlice();
  const Icon = getIcon(props.notification.type);
  const title = getTitle(props.notification.type);

  return (
    <StyledToast
      delay={10000}
      autohide
      onClose={() =>
        dispatch(globalActions.deleteNotification(props.notification.id))
      }
    >
      <Toast.Header>
        {Icon}
        <strong className="mr-auto">{title}</strong>
      </Toast.Header>
      <Toast.Body>{props.notification.message}</Toast.Body>
    </StyledToast>
  );
};

const NotificationContainer: React.FC = props => {
  const notifications = useSelector(selectNotifications);

  return (
    <Wrapper>
      {notifications.map(n => (
        <NotificationToast notification={n} key={n.id} />
      ))}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  overflow-y: auto;
  max-height: calc(100vh - 1em);
  z-index: 1060 !important; // To be in front of modal
  position: fixed;
  bottom: 1em;
  right: 1em;
  z-index: 100;
  display: flex;
  gap: 1em;
  flex-flow: column;
`;

const StyledToast = styled(Toast)`
  min-width: 30em;
  width: 30em;
  max-width: 30em;
  background: var(--clr-menu);
  color: var(--clr-white);

  .toast-header {
    background: var(--clr-menu);
    color: var(--clr-white);
    & svg {
      padding-right: 0.5em;
    }
  }

  span {
    color: var(--clr-white);
  }

  span:hover {
    color: var(--clr-dark-gray);
  }
`;

export default NotificationContainer;
