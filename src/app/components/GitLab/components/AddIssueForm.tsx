import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { gitLabActions } from 'app';
import {
  deleteIssue as ApiDeleteIssue,
  updateIssue as ApiUpdateIssue,
  createNewIssue,
} from 'app/apis/gitlab';
import { displayGitLabErrorNotification } from 'app/apis/gitlab/helper';
import { GitLabIssue, GitLabProject } from 'app/apis/gitlab/types';
import DeleteButton from 'app/components/common/DeleteButton';
import {
  selectProjectByNameWithNamespace,
  selectProjects,
} from 'app/data/gitLabSlice/selectors/projectSelectors';
import { selectUrl } from 'app/data/gitLabSlice/selectors/selectors';
import React, { FormEvent, useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import Form from 'react-bootstrap/Form';
import { useDispatch, useSelector } from 'react-redux';
import { styled } from 'styled-components';

type PropTypes = {
  issue?: GitLabIssue; // Set this to pre-fill values and edit the issue
  project?: GitLabProject;
  onSuccess?: () => void;
};

const createOrUpdateIssue = async (
  title: string,
  description: string | undefined,
  dueDate: string | undefined,
  issue: GitLabIssue | undefined,
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

  if (!gitLabUrl) return;
  if (!project) return;

  try {
    setLoading(true);
    if (issue) {
      // Update existing issue
      const updatedIssue = await ApiUpdateIssue(
        issue.project_id,
        issue.iid,
        {
          title: title,
          description: description || '',
          due_date: dueDate || '',
        },
        project.path_with_namespace,
        gitLabUrl,
      );
      dispatch(gitLabActions.upsertIssue({ issue: updatedIssue }));
    } else {
      // create new issue
      const newIssue = await createNewIssue(
        project.id,
        {
          title: title,
          description: description || undefined,
          due_date: dueDate || undefined,
        },
        project.path_with_namespace,
        gitLabUrl,
      );
      dispatch(gitLabActions.upsertIssue({ issue: newIssue }));
    }
    form.reset();
    setValidated(false);
    onHide();
  } catch (error) {
    displayGitLabErrorNotification(error, dispatch);
  } finally {
    setLoading(false);
  }
};

const deleteIssue = async (
  issue: GitLabIssue,
  project: GitLabProject | undefined,
  gitLabUrl: string | undefined,
  setLoading,
  onSuccess,
  dispatch,
) => {
  if (!issue) return;
  if (!gitLabUrl) return;
  if (!project) return;

  try {
    setLoading(true);
    await ApiDeleteIssue(project.id, issue.iid, gitLabUrl);
    dispatch(gitLabActions.removeIssue({ issue }));
    onSuccess();
  } catch (error) {
    displayGitLabErrorNotification(error, dispatch);
  } finally {
    setLoading(false);
  }
};

const AddIssueForm: React.FC<PropTypes> = props => {
  const { issue } = props;

  const [title, setTitle] = useState<string>(props.issue?.title || '');
  const [description, setDescription] = useState<string>(
    props.issue?.description || '',
  );
  const [dueDate, setDueDate] = useState<string>(props.issue?.due_date || '');
  const [projectName, setProjectName] = useState<string>(
    props.project?.name || '',
  );
  const [validated, setValidated] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [isSuccess, setSuccess] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const availableProjects = useSelector(selectProjects).map(
    project => project.name_with_namespace,
  );
  const formProject = useSelector(state =>
    selectProjectByNameWithNamespace(state, {
      projectName: projectName,
    }),
  );
  const url = useSelector(selectUrl);
  const dispatch = useDispatch();

  const project = props.project ? props.project : formProject;

  useEffect(() => {
    setTitle(issue?.title || '');
    setDescription(issue?.description || '');
    setDueDate(issue?.due_date || '');
  }, [issue]);

  const onSuccess = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 1000);
    if (props.onSuccess) {
      props.onSuccess();
    }
  };

  const submit = (
    title: string,
    description: string,
    dueDate: string,
    e: FormEvent<HTMLFormElement>,
  ) => {
    createOrUpdateIssue(
      title,
      description,
      dueDate,
      issue,
      e,
      project,
      url,
      setValidated,
      setLoading,
      onSuccess,
      dispatch,
    );
  };

  const buttonLabel = props.issue ? 'Update Issue' : 'Create Issue';
  let button = <Button type="submit">{buttonLabel}</Button>;
  if (isSuccess) {
    button = (
      <Button variant="success">
        <FontAwesomeIcon icon="check" />
      </Button>
    );
  }
  if (isLoading) {
    button = (
      <Button disabled>
        <FontAwesomeIcon icon="sync" spin />
      </Button>
    );
  }

  return (
    <Form
      noValidate
      validated={validated}
      onSubmit={e => submit(title, description, dueDate, e)}
    >
      {!props.project && availableProjects.length > 0 && (
        <Form.Group className="mb-3">
          <Form.Label>Project (required)</Form.Label>
          <Form.Select
            id="projectName"
            required
            disabled={isLoading}
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
          >
            {availableProjects.map(p => (
              <option>{p}</option>
            ))}
          </Form.Select>
          <Form.Control.Feedback type="invalid">
            Please select a project
          </Form.Control.Feedback>
        </Form.Group>
      )}
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
      <Buttons>
        {button}
        {issue && (
          <DeleteButton
            label="Delete issue"
            isLoading={deleteLoading}
            onDelete={() => {
              deleteIssue(
                issue,
                project,
                url,
                setDeleteLoading,
                () => {
                  if (props.onSuccess) {
                    props.onSuccess();
                  }
                },
                dispatch,
              );
            }}
          />
        )}
      </Buttons>
    </Form>
  );
};

const Buttons = styled.div`
  display: flex;
  gap: 1em;
`;

export default AddIssueForm;
