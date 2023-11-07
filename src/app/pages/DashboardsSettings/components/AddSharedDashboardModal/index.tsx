import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import styled from 'styled-components';
import { globalActions } from 'app';
import { replacer, reviver } from 'app/apis/persistance';
import { ConfiguredVisualisation } from 'app/data/VisualisationTypes';
import { getAfterVisualisationUpdatedActions } from 'app/data/VisualisationTypes';

type ShareModalPropTypes = {
  show: boolean;
  onHide: () => void;
};

function isVisualisation(obj: any): obj is ConfiguredVisualisation {
  return (
    typeof obj.x === 'number' &&
    typeof obj.y === 'number' &&
    typeof obj.h === 'number' &&
    typeof obj.w === 'number' &&
    typeof obj.minH === 'number' &&
    typeof obj.minW === 'number' &&
    typeof obj.type === 'number' &&
    typeof obj.id === 'string' &&
    (!obj.props || typeof obj.props === 'object')
  );
}

const cleanVisualisationInput = (obj: any) => {
  return {
    x: obj.x,
    y: obj.y,
    h: obj.h,
    w: obj.w,
    minH: obj.minH,
    minW: obj.minW,
    type: obj.type,
    id: obj.id,
    props: obj.props || {},
  };
};

function checkParsedInput(parsed: any) {
  // Check that name exists
  if (!parsed.name) {
    throw new Error('Missing field "name"');
  }
  if (typeof parsed.name !== 'string') {
    throw new Error('"name" must be a string');
  }
  // Check that visualisations exist
  if (!parsed.visualisations) {
    throw new Error('Missing field "visualisations"');
  }
  // Check that visualisations are an array
  if (!Array.isArray(parsed.visualisations)) {
    throw new Error('"visualisations" must be an array');
  }
  // Check that each visualisation is in correct format
  for (let vis of parsed.visualisations) {
    if (!isVisualisation(vis)) {
      throw new Error('Incorrect visualisation format');
    }
  }
}

const cleanParsedInput = (parsed: any) => {
  const visualisations = parsed.visualisations.map(vis =>
    cleanVisualisationInput(vis),
  );
  return {
    name: parsed.name,
    visualisations,
  };
};

const AddSharedDashboardModal: React.FC<ShareModalPropTypes> = props => {
  const dispatch = useDispatch();
  const [config, setConfig] = useState<string>('');

  useEffect(() => {
    setConfig('');
  }, [props.show]);

  const saveDashboard = () => {
    try {
      // parse input as JSON
      const parsed = JSON.parse(config, reviver);
      checkParsedInput(parsed);
      // Add the new dashboard
      dispatch(
        globalActions.addSharedDashboard({
          name: parsed.name,
          visualisations: parsed.visualisations,
        }),
      );
      // Call afterUpdateActions for all visualisations
      // This configures the attached stores properly
      parsed.visualisations
        .map((vis: ConfiguredVisualisation) =>
          getAfterVisualisationUpdatedActions(vis.type, vis.id, vis.props),
        )
        .flat()
        .forEach(action => dispatch(action));
      dispatch(globalActions.addNotification('Successfully added Dashboard'));
      props.onHide();
    } catch (error) {
      if (error instanceof SyntaxError) {
        dispatch(globalActions.addErrorNotification('Invalid JSON Input!'));
      } else if (error instanceof Error) {
        dispatch(globalActions.addErrorNotification(error.message));
      } else {
        dispatch(
          globalActions.addErrorNotification(
            'An unknwon error occured while trying to save the dashboard',
          ),
        );
      }
    }
  };

  const pasteFromClipboard = async () => {
    let clipboardText;
    try {
      clipboardText = await navigator.clipboard.readText();
    } catch (error) {
      if (error instanceof Error) {
        dispatch(
          globalActions.addErrorNotification('Cannot paste: ' + error.message),
        );
      } else {
        dispatch(
          globalActions.addErrorNotification('Cannot paste: Unknown Error'),
        );
      }
    }

    // Parse and clean input to make sure it fits the expected format
    try {
      // parse
      const parsed = JSON.parse(clipboardText, reviver);
      // clean
      const cleaned = cleanParsedInput(parsed);
      // stringify and pretty print again, we need the state to have the string representation for editing
      setConfig(JSON.stringify(cleaned, replacer, 2));
    } catch (error) {
      dispatch(globalActions.addErrorNotification('Invalid JSON'));
    }
  };

  return (
    <Modal size="lg" show={props.show} centered onHide={props.onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Import Dashboard Configuration</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3">
          Add a shared dashboard configuration from your clipboard via the
          button below. You can check and edit the configuration before adding
          the new Dashboard (e.g. you can change the name).
        </div>
        <div className="mb-3">
          Credentials can also be edited via the 'Configure Widget' button after
          the dashboard was created.
        </div>
        <div className="mb-3">
          Please make sure that the necessary data sources are configured before
          importing a shared dashboard.
        </div>
        <Button onClick={() => pasteFromClipboard()} className="mb-3">
          Paste from Clipboard
        </Button>
        <StyledFormControl
          as="textarea"
          onChange={a => setConfig(a.target.value)}
          value={config}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={saveDashboard}>Add new Dashboard</Button>
      </Modal.Footer>
    </Modal>
  );
};

const StyledFormControl = styled(Form.Control)`
  height: 40vh;
  width: 100%;
`;

export default AddSharedDashboardModal;
