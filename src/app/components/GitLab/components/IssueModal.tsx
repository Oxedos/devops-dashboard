import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { gitLabActions } from 'app';
import { updateIssue as ApiUpdateIssue, createNewIssue } from 'app/apis/gitlab';
import { displayGitLabErrorNotification } from 'app/apis/gitlab/helper';
import { GitLabIssue } from 'app/apis/gitlab/types';
import { selectGroups } from 'app/data/gitLabSlice/selectors/groupSelectors';
import { selectProjects } from 'app/data/gitLabSlice/selectors/projectSelectors';
import { selectUrl } from 'app/data/gitLabSlice/selectors/selectors';

export type PropTypes = {
  onHide: () => void;
  projectId?: number;
  issue?: GitLabIssue; // Set this to pre-fill values and edit the issue
};

const submitNewIssue = async (
  event: React.FormEvent<HTMLFormElement>,
  projectId: number | undefined,
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

  if (!projectId) return;
  if (!gitLabUrl) return;

  try {
    const target: any = event.target;
    setLoading(true);
    const newIssue = await createNewIssue(
      projectId,
      {
        title: target.title.value,
        description: target.description.value || undefined,
        due_date: target.dueDate.value || undefined,
        labels: target.project.value
          ? [`project::${target.project.value}`]
          : [''],
      },
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
        labels: target.project.value
          ? [`project::${target.project.value}`]
          : [''],
      },
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
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
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
    if (props.issue && props.issue.labels) {
      const projectLabel = props.issue.labels
        .map(label => (typeof label === 'string' ? label : label.name))
        .find(label => label && label.startsWith('project::'));
      if (projectLabel) {
        const projectName = projectLabel.split('::')[1];
        const project = projects.find(project => project.name === projectName);
        const group = groups.find(
          group => project && project.name_with_namespace.includes(group.name),
        );
        if (project && group) {
          setSelectedGroup(group.name);
          setSelectedProject(projectName);
        }
      }
    } else {
      setSelectedProject('');
      setSelectedGroup('');
    }
  }, [props.issue, groups, projects]);

  if (!props.projectId) return null;
  const buttonLabel = props.issue ? 'Update Issue' : 'Create Issue';

  const submit = e => {
    if (props.issue) {
      updateIssue(
        e,
        props.issue,
        url,
        setValidated,
        setLoading,
        props.onHide,
        dispatch,
      );
    } else {
      submitNewIssue(
        e,
        props.projectId,
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
          <Form.Group className="mb-3">
            <Form.Text>
              Choose an associated Project by first selecting the projects
              group. The assoicated project will set a label on the issue.
              <br />
            </Form.Text>
            <Form.Label>Group</Form.Label>
            <Form.Select
              disabled={isLoading}
              value={selectedGroup}
              onChange={e => setSelectedGroup(e.target.value)}
            >
              {[''].concat(groups.map(group => group.name)).map(groupName => (
                <option>{groupName}</option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label>Project</Form.Label>
            <Form.Select
              id="project"
              disabled={isLoading}
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
            >
              {['']
                .concat(
                  projects
                    .filter(project =>
                      project.name_with_namespace.includes(selectedGroup),
                    )
                    .map(project => project.name),
                )
                .map(projectName => (
                  <option>{projectName}</option>
                ))}
            </Form.Select>
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
