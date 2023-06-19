import React, { useEffect, useState } from 'react';
import { replacer, reviver } from 'app/apis/persistance';
import { BlueButton } from 'app/components/Design/Buttons';
import DarkModal from 'app/components/Design/DarkModal';
import { DarkFormControl } from 'app/components/Design/DarkForm';
import { globalActions } from 'app/data/globalSlice';
import Modal from 'react-bootstrap/esm/Modal';
import { useDispatch } from 'react-redux';
import styled from 'styled-components/macro';
import { Dashboard } from 'app/data/globalSlice/types';

type ShareModalPropTypes = {
  show: boolean;
  dashboardId: string;
  onHide: Function;
  dashboard: Dashboard;
};

const ShareModal: React.FC<ShareModalPropTypes> = props => {
  const dashboardCopy: any = Object.assign({}, props.dashboard);
  delete dashboardCopy.isMainDashboard;
  const dispatch = useDispatch();
  const [config, setConfig] = useState(
    JSON.stringify(dashboardCopy, replacer, 2),
  );

  useEffect(() => {
    const dashboardCopy: any = Object.assign({}, props.dashboard);
    delete dashboardCopy.isMainDashboard;
    setConfig(JSON.stringify(dashboardCopy, replacer, 2));
  }, [props.show, props.dashboard]);

  const copyToClipboard = async () => {
    try {
      // test if json is valid by parsing it
      JSON.parse(config, reviver);

      await navigator.clipboard.writeText(config);
      dispatch(globalActions.addNotification('Sucessfully copied'));
    } catch (error) {
      if (error instanceof SyntaxError) {
        dispatch(
          globalActions.addErrorNotification(
            'Cannot copy: Config is not valid JSON',
          ),
        );
      } else if (error instanceof Error) {
        dispatch(
          globalActions.addErrorNotification('Cannot copy: ' + error.message),
        );
      } else {
        dispatch(
          globalActions.addErrorNotification('Cannot copy: Unknown Error'),
        );
      }
    }
  };

  return (
    <DarkModal size="lg" show={props.show} centered onHide={props.onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Share Configuration</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert>
          Watch out! The configuration can contain secrets like API keys or
          (base64 encoded) credentials! Check the output below and delete any
          secrets you do not wish to share.
        </Alert>
        <StyledDarkFormControl
          as="textarea"
          onChange={a => setConfig(a.target.value)}
        >
          {config}
        </StyledDarkFormControl>
      </Modal.Body>
      <Modal.Footer>
        <BlueButton block onClick={copyToClipboard}>
          Copy to Clipboard
        </BlueButton>
      </Modal.Footer>
    </DarkModal>
  );
};

const Alert = styled.div`
  width: 100%;
  padding: 1em;
  border: 1px solid var(--clr-red);
  background: var(--clr-red-lighter);
  color: var(--clr-white);
  border-radius: 0.25em;
  margin-bottom: 1em;
`;

const StyledDarkFormControl = styled(DarkFormControl)`
  height: 65vh;
  width: 100%;
`;

export default ShareModal;
