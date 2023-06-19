import React, { useState } from 'react';
import Form from 'react-bootstrap/Form';
import ContentElement from '../../../../components/Design/ContentElement';
import { useDispatch, useSelector } from 'react-redux';
import { globalActions } from 'app/data/globalSlice';
import {
  selectConfigured,
  selectProductToken,
  selectUrl,
  selectUserKey,
} from 'app/data/whitesourceSlice/selectors';
import { whitesourceActions } from 'app/data/whitesourceSlice';
import DarkForm from 'app/components/Design/DarkForm';
import { BlueButton, RedButton } from 'app/components/Design/Buttons';
import InputGroup from 'react-bootstrap/InputGroup';
import DarkInputGroupText from 'app/components/Design/DarkInputGroupText';
import { API_SUFFIX } from 'app/apis/whitesource';

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
      <DarkForm>
        <Form.Group>
          <Form.Label>Whitesource URL*</Form.Label>
          <InputGroup>
            <Form.Control
              placeholder="https://example.com"
              value={newUrl || ''}
              onChange={({ target: { value } }) => setNewUrl(value)}
            />
            <DarkInputGroupText>{API_SUFFIX}</DarkInputGroupText>
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
        <BlueButton onClick={saveConfig}>Save</BlueButton>
        {configured && (
          <RedButton
            className="ml-3"
            onClick={() => dispatch(whitesourceActions.deleteConfiguration())}
          >
            Delete Configuration
          </RedButton>
        )}
      </DarkForm>
    </ContentElement>
  );
};

export default Config;
