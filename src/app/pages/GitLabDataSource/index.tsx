import ContentWrapper from 'app/components/Design/ContentWrapper';
import NavigationBar from 'app/components/NavigationBar';
import { selectGroups } from 'app/data/gitLabSlice/groupSelectors';
import { selectAllMrs } from 'app/data/gitLabSlice/mrSelectors';
import { selectProjects } from 'app/data/gitLabSlice/projectSelectors';
import { selectUserData } from 'app/data/gitLabSlice/selectors';
import { Helmet } from 'react-helmet-async';
import { useSelector } from 'react-redux';
import TokenInput from './Components/Config';
import GitLabData from './Components/GitLabData';

export function GitLabDataSource() {
  // const configured = useSelector(selectConfigured);
  const groups = useSelector(selectGroups);
  const userData = useSelector(selectUserData);
  const mrs = useSelector(selectAllMrs);
  const projects = useSelector(selectProjects);

  // TODO: For Debugging
  const configured = false; // TODO

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
          <TokenInput />
        </ContentWrapper>
      )}
    </>
  );
}
