import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { gitLabActions } from 'app';
import { updateIssue as ApiUpdateIssue, createNewIssue } from 'app/apis/gitlab';
import { displayGitLabErrorNotification } from 'app/apis/gitlab/helper';
import { GitLabIssue, GitLabProject } from 'app/apis/gitlab/types';
import { selectGroups } from 'app/data/gitLabSlice/selectors/groupSelectors';
import { selectProjects } from 'app/data/gitLabSlice/selectors/projectSelectors';
import { selectUrl } from 'app/data/gitLabSlice/selectors/selectors';

export type PropTypes = {
  onHide: () => void;
  project: GitLabProject;
  issue?: GitLabIssue; // Set this to pre-fill values and edit the issue
};

const submitNewIssue = async (
  event: React.FormEvent<HTMLFormElement>,
  project: GitLabProject | undefined,
  gitLabUrl: string | undefined,
  setValidated,
  setLoading,
  onHide,
  dispatch,
) => {
  const form = event.currentTarget;
  if (form.checkValidity() === false) {
    event.preventDefault();
    event.stopPropagation();
    setValidated(true);
    return;
  } else {
    event.preventDefault();
    event.stopPropagation();
    setValidated(true);
  }

  if (!project) return;
  if (!gitLabUrl) return;

  try {
    const target: any = event.target;
    setLoading(true);
    const newIssue = await createNewIssue(
      project.id,
      {
        title: target.title.value,
        description: target.description.value || undefined,
        due_date: target.dueDate.value || undefined,
      },
      project.path_with_namespace,
      gitLabUrl,
    );
    dispatch(gitLabActions.upsertIssue({ issue: newIssue }));
    form.reset();
    setValidated(false);
    onHide();
  } catch (error) {
    displayGitLabErrorNotification(error, dispatch);
  } finally {
    setLoading(false);
  }
};

const updateIssue = async (
  event: React.FormEvent<HTMLFormElement>,
  issue: GitLabIssue,
  project: GitLabProject,
  gitLabUrl: string | undefined,
  setValidated,
  setLoading,
  onHide,
  dispatch,
) => {
  const form = event.currentTarget;
  if (form.checkValidity() === false) {
    event.preventDefault();
    event.stopPropagation();
    setValidated(true);
    return;
  } else {
    event.preventDefault();
    event.stopPropagation();
    setValidated(true);
  }

  if (!issue) return;
  if (!gitLabUrl) return;

  try {
    const target: any = event.target;
    setLoading(true);
    const newIssue = await ApiUpdateIssue(
      issue.project_id,
      issue.iid,
      {
        title: target.title.value,
        description: target.description.value || '',
        due_date: target.dueDate.value || '',
      },
      project.path_with_namespace,
      gitLabUrl,
    );
    dispatch(gitLabActions.upsertIssue({ issue: newIssue }));
    form.reset();
    setValidated(false);
    onHide();
  } catch (error) {
    displayGitLabErrorNotification(error, dispatch);
  } finally {
    setLoading(false);
  }
};

const IssueModal: React.FC<PropTypes> = props => {
  const [title, setTitle] = useState(props.issue?.title);
  const [description, setDescription] = useState(props.issue?.description);
  const [dueDate, setDueDate] = useState(props.issue?.due_date);
  const [validated, setValidated] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const url = useSelector(selectUrl);
  const groups = useSelector(selectGroups);
  const projects = useSelector(selectProjects);
  const dispatch = useDispatch();

  useEffect(() => {
    setTitle(props.issue?.title);
    setDescription(props.issue?.description);
    setDueDate(props.issue?.due_date);
  }, [props.issue, groups, projects]);

  if (!props.project) return null;
  const buttonLabel = props.issue ? 'Update Issue' : 'Create Issue';

  const submit = e => {
    if (props.issue) {
      updateIssue(
        e,
        props.issue,
        props.project,
        url,
        setValidated,
        setLoading,
        props.onHide,
        dispatch,
      );
    } else {
      submitNewIssue(
        e,
        props.project,
        url,
        setValidated,
        setLoading,
        props.onHide,
        dispatch,
      );
    }
  };

  return (
    <Modal show onHide={props.onHide}>
      <Modal.Header closeButton>
        <h4>{props.issue ? 'Edit Issue' : 'New Issue'}</h4>
      </Modal.Header>
      <Modal.Body>
        <Form noValidate validated={validated} onSubmit={submit}>
          <Form.Group className="mb-3">
            <Form.Label>Title (required)</Form.Label>
            <Form.Control
              id="title"
              required
              placeholder="Title"
              disabled={isLoading}
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <Form.Control.Feedback type="invalid">
              Please provide a Title
            </Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              id="description"
              as="textarea"
              placeholder="Description"
              disabled={isLoading}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Due date</Form.Label>
            <Form.Control
              id="dueDate"
              type="date"
              disabled={isLoading}
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </Form.Group>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <FontAwesomeIcon icon="sync" spin /> : buttonLabel}
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default IssueModal;
