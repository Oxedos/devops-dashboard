import React from 'react';
import { Helmet } from 'react-helmet-async';
import ContentWrapper from 'app/components/Dashboard/ContentWrapper';
import NavigationBar from 'app/components/Dashboard/NavigationBar';
import Config from './Components/Config';

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
