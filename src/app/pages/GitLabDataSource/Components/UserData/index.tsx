import { GitLabUserData } from 'app/apis/gitlab/types';
import React from 'react';
import ContentElement from '../../../../components/Design/ContentElement';
import DarkTable from 'app/components/Design/DarkTable';

type PropTypes = {
  userData: GitLabUserData;
};

const UserData: React.FC<PropTypes> = props => {
  const { userData } = props;

  if (!userData) {
    return null;
  }

  return (
    <ContentElement>
      <DarkTable>
        <tbody>
          <tr>
            <td>ID</td>
            <td>{userData.id}</td>
          </tr>
          <tr>
            <td>Name</td>
            <td>{userData.name}</td>
          </tr>
          <tr>
            <td>Username</td>
            <td>{userData.username}</td>
          </tr>
          <tr>
            <td>E-Mail</td>
            <td>{userData.email}</td>
          </tr>
        </tbody>
      </DarkTable>
    </ContentElement>
  );
};

export default UserData;
