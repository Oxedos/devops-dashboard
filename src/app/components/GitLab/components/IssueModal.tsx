import { GitLabIssue, GitLabProject } from 'app/apis/gitlab/types';
import React from 'react';
import { Modal } from 'react-bootstrap';
import AddIssueForm from './AddIssueForm';

export type PropTypes = {
  onHide: () => void;
  project: GitLabProject;
  issue?: GitLabIssue; // Set this to pre-fill values and edit the issue
};

const IssueModal: React.FC<PropTypes> = props => {
  if (!props.project) return null;

  return (
    <Modal show onHide={props.onHide}>
      <Modal.Header closeButton>
        <h4>{props.issue ? 'Edit Issue' : 'New Issue'}</h4>
      </Modal.Header>
      <Modal.Body>
        <AddIssueForm
          issue={props.issue}
          project={props.project}
          onSuccess={props.onHide}
        />
      </Modal.Body>
    </Modal>
  );
};

export default IssueModal;
