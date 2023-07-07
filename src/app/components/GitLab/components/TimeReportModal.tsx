import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Modal from 'react-bootstrap/Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { gitLabActions } from 'app';
import { addTimeSpent } from 'app/apis/gitlab';
import { displayGitLabErrorNotification } from 'app/apis/gitlab/helper';
import { GitLabIssue } from 'app/apis/gitlab/types';
import { selectUrl } from 'app/data/gitLabSlice/selectors/selectors';

export type PropTypes = {
  onHide: () => void;
  issue: GitLabIssue;
};

const updateTimeSpent = async (
  event: React.FormEvent<HTMLFormElement>,
  issue: GitLabIssue,
  gitLabUrl: string | undefined,
  setValidated,
  setLoading,
  onSuccess,
  dispatch,
) => {
  const form = event.currentTarget;
  event.preventDefault();
  event.stopPropagation();
  setValidated(true);
  if (form.checkValidity() === false) {
    return;
  }

  if (!issue) return;
  if (!gitLabUrl) return;

  try {
    const target: any = event.target;
    setLoading(true);
    const newTimeStats = await addTimeSpent(
      issue.project_id,
      issue.iid,
      target.duration.value || '',
      gitLabUrl,
    );
    dispatch(
      gitLabActions.upsertIssue({
        issue: { ...issue, time_stats: newTimeStats },
      }),
    );
    form.reset();
    onSuccess();
  } catch (error) {
    displayGitLabErrorNotification(error, dispatch);
  } finally {
    setLoading(false);
  }
};

const TimeReportModal: React.FC<PropTypes> = props => {
  const [isLoading, setLoading] = useState(false);
  const [isValidated, setValidated] = useState(false);
  const [success, setSuccess] = useState(false);
  const dispatch = useDispatch();
  const gitLabUrl = useSelector(selectUrl);
  if (!props.issue) return null;

  const onSuccess = () => {
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setValidated(false);
    }, 1500);
  };

  let buttonLabel: any = 'Save';
  if (isLoading) {
    buttonLabel = <FontAwesomeIcon icon="sync" spin />;
  } else if (success) {
    buttonLabel = <FontAwesomeIcon icon="check" />;
  }

  return (
    <Modal show onHide={props.onHide}>
      <Modal.Header closeButton>Time Report</Modal.Header>
      <Modal.Body>
        Time Spent: {props.issue.time_stats.human_total_time_spent}
        <Form
          noValidate
          validated={isValidated}
          onSubmit={e =>
            updateTimeSpent(
              e,
              props.issue,
              gitLabUrl,
              setValidated,
              setLoading,
              onSuccess,
              dispatch,
            )
          }
        >
          <Form.Group className="mt-4">
            <Form.Label>
              Record time spent{' '}
              <a
                href="https://docs.gitlab.com/ee/user/project/time_tracking.html#available-time-units"
                target="_blank"
                rel="noreferrer"
              >
                <FontAwesomeIcon icon="circle-info" />
              </a>
            </Form.Label>
            <InputGroup>
              <Form.Control placeholder="1h 30m" id="duration" />
              <Button
                variant="outline-success"
                type="submit"
                disabled={isLoading}
              >
                {buttonLabel}
              </Button>
            </InputGroup>
            <Form.Text>
              Record time spent for this issue. Example: 1h 30 or -30m
            </Form.Text>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer></Modal.Footer>
    </Modal>
  );
};

export default TimeReportModal;
