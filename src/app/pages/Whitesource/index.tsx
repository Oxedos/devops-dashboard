import React from 'react';
import { Helmet } from 'react-helmet-async';
import Config from './Components/Config';
import ContentWrapper from 'app/components/Design/ContentWrapper';
import NavigationBar from 'app/components/NavigationBar';

export function Whitesource() {
  return (
    <>
      <Helmet>
        <title>Configure Whitesource Data Source</title>
        <meta name="description" content="A DevOps Dashboard" />
      </Helmet>
      <NavigationBar />
      <ContentWrapper>
        <Config />
      </ContentWrapper>
    </>
  );
}
