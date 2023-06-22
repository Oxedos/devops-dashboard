import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useSelector, useDispatch } from 'react-redux';
import { useGitLabSlice } from 'app/data/gitLabSlice';
import {
  selectToken,
  selectUserData,
  selectGroups,
  selectProjects,
  selectConfigured,
  selectUrl,
} from 'app/data/gitLabSlice/selectors';
import TokenInput from './Components/Config';
import GitLabData from './Components/GitLabData';
import ContentWrapper from 'app/components/Design/ContentWrapper';
import NavigationBar from 'app/components/NavigationBar';
import { selectAllMrs } from 'app/data/gitLabSlice/mrSelectors';

export function GitLabDataSource() {
  const { actions: gitLabActions } = useGitLabSlice();
  const dispatch = useDispatch();
  const configured = useSelector(selectConfigured);
  const url = useSelector(selectUrl);
  const token = useSelector(selectToken);
  const groups = useSelector(selectGroups);
  const userData = useSelector(selectUserData);
  const mrs = useSelector(selectAllMrs);
  const projects = useSelector(selectProjects);

  return (
    <>
      <Helmet>
        <title>Configure GitLab Data Source</title>
        <meta name="description" content="A DevOps Dashboard" />
      </Helmet>
      <NavigationBar />
      {configured ? (
        <GitLabData
          userData={userData}
          groups={groups}
          mrs={mrs}
          projects={projects}
        />
      ) : (
        <ContentWrapper>
          <TokenInput
            token={token}
            url={url}
            saveConfig={({ token, url }) => {
              dispatch(gitLabActions.setToken(token));
              dispatch(gitLabActions.setUrl(url));
              dispatch(gitLabActions.setConfigured(true));
            }}
          />
        </ContentWrapper>
      )}
    </>
  );
}
