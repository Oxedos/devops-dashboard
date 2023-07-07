import React from 'react';
import { Helmet } from 'react-helmet-async';
import Config from './Components/Config';
import NavigationBar from 'app/components/Dashboard/NavigationBar';
import ContentWrapper from 'app/components/Dashboard/ContentWrapper';

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
