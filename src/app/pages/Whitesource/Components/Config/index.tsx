import React, { useState } from 'react';
import InputGroup from 'react-bootstrap/InputGroup';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { useDispatch, useSelector } from 'react-redux';
import { globalActions, whitesourceActions } from 'app';
import {
  selectConfigured,
  selectProductToken,
  selectUrl,
  selectUserKey,
} from 'app/data/whitesourceSlice/selectors';
import { API_SUFFIX } from 'app/apis/whitesource';
import ContentElement from 'app/components/Dashboard/ContentElement';

const Config: React.FC = props => {
  const configured = useSelector(selectConfigured);
  const url = useSelector(selectUrl);
  const userKey = useSelector(selectUserKey);
  const productToken = useSelector(selectProductToken);

  const [newUserKey, setNewUserKey] = useState(userKey);
  const [newProductToken, setNewProductToken] = useState(productToken);
  const [newUrl, setNewUrl] = useState(url);
  const dispatch = useDispatch();

  const saveConfig = () => {
    if (!newUrl) {
      dispatch(
        globalActions.addErrorNotification("Whitesource Url can't be empty"),
      );
      return;
    }
    if (!newProductToken) {
      dispatch(
        globalActions.addErrorNotification("Product Token can't be empty"),
      );
      return;
    }
    if (!newUserKey) {
      dispatch(globalActions.addErrorNotification("User Key can't be empty"));
      return;
    }
    dispatch(whitesourceActions.setUrl(newUrl.trim()));
    dispatch(whitesourceActions.setUserKey(newUserKey));
    dispatch(whitesourceActions.setProductToken(newProductToken));
    dispatch(whitesourceActions.setConfigured(true));
  };

  return (
    <ContentElement>
      <h2>Whitesource Settings</h2>
      <hr />
      <h4>State: {configured ? 'Connected' : 'Not Configured'}</h4>
      <hr />
      <Form>
        <Form.Group>
          <Form.Label>Whitesource URL*</Form.Label>
          <InputGroup>
            <Form.Control
              placeholder="https://example.com"
              value={newUrl || ''}
              onChange={({ target: { value } }) => setNewUrl(value)}
            />
            <InputGroup.Text>{API_SUFFIX}</InputGroup.Text>
          </InputGroup>
        </Form.Group>
        <Form.Group>
          <Form.Label>User Key*</Form.Label>
          <Form.Control
            required
            placeholder="User Key"
            type="password"
            value={newUserKey || ''}
            onChange={({ target: { value } }) => setNewUserKey(value)}
          />
        </Form.Group>
        <Form.Group>
          <Form.Label>Product Token*</Form.Label>
          <Form.Control
            required
            placeholder="Product Token"
            value={newProductToken || ''}
            type="password"
            onChange={({ target: { value } }) => setNewProductToken(value)}
          />
        </Form.Group>
        <Button onClick={saveConfig}>Save</Button>
        {configured && (
          <Button
            className="ml-3"
            variant="danger"
            onClick={() => dispatch(whitesourceActions.deleteConfiguration())}
          >
            Delete Configuration
          </Button>
        )}
      </Form>
    </ContentElement>
  );
};

export default Config;
