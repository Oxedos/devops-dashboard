import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Modal from 'react-bootstrap/Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { gitLabActions } from 'app';
import { addTimeSpent } from 'app/apis/gitlab';
import { displayGitLabErrorNotification } from 'app/apis/gitlab/helper';
import { GitLabIssue } from 'app/apis/gitlab/types';
import LoadingButton, {
  LoadingState,
} from 'app/components/common/LoadingButton';
import { selectUrl } from 'app/data/gitLabSlice/selectors/selectors';

export type PropTypes = {
  onHide: () => void;
  issue: GitLabIssue;
};

const updateTimeSpent = async (
  event: React.FormEvent<HTMLFormElement>,
  timeSpent: string,
  issue: GitLabIssue,
  gitLabUrl: string | undefined,
  setState: React.Dispatch<React.SetStateAction<LoadingState>>,
  onSuccess,
  dispatch,
) => {
  const form = event.currentTarget;
  event.preventDefault();
  event.stopPropagation();
  if (form.checkValidity() === false) {
    return;
  }

  if (!issue) return;
  if (!gitLabUrl) return;

  try {
    setState(LoadingState.loading);
    const newTimeStats = await addTimeSpent(
      issue.project_id,
      issue.iid,
      timeSpent,
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
    setState(LoadingState.error);
    displayGitLabErrorNotification(error, dispatch);
    setTimeout(() => setState(LoadingState.pending), 1500);
  }
};

const TimeReportModal: React.FC<PropTypes> = props => {
  const [state, setState] = useState<LoadingState>(LoadingState.pending);
  const [timeSpent, setTimeSpent] = useState('');
  const dispatch = useDispatch();
  const gitLabUrl = useSelector(selectUrl);
  if (!props.issue) return null;

  const onSuccess = () => {
    setState(LoadingState.success);
    setTimeSpent('');
    setTimeout(() => setState(LoadingState.pending), 1500);
  };

  return (
    <Modal show onHide={props.onHide}>
      <Modal.Header closeButton>Time Report</Modal.Header>
      <Modal.Body>
        Time Spent: {props.issue.time_stats.human_total_time_spent}
        <Form
          noValidate
          validated={!!timeSpent}
          onSubmit={e =>
            updateTimeSpent(
              e,
              timeSpent,
              props.issue,
              gitLabUrl,
              setState,
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
              <Form.Control
                placeholder="1h 30m"
                id="duration"
                value={timeSpent}
                onChange={e => setTimeSpent(e.target.value)}
                pattern="^-?(\d+\s*((months)|(month)|(mo)|(weeks)|(week)|(w)|(days)|(day)|(d)|(hours)|(hour)|(h)|(minutes)|(minute)|(m))\s*)+$"
              />
              <LoadingButton variant="primary" type="submit" state={state}>
                Save
              </LoadingButton>
              <Form.Control.Feedback type="invalid">
                Invalid time format. See{' '}
                <a
                  href="https://docs.gitlab.com/ee/user/project/time_tracking.html#available-time-units"
                  target="_blank"
                  rel="noreferrer"
                >
                  docs
                </a>{' '}
                for help.
              </Form.Control.Feedback>
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
