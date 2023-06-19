import React from 'react';
import { FieldType } from 'app/components/visualisations/components/withWidgetConfigurationModal';

type ComponentWithFilterProps = {
  id: string;
  url?: string;
};

const withFieldProvider = (WrappedComponent: React.FC<any>) => {
  return (props: ComponentWithFilterProps) => {
    const fields: FieldType[] = [
      {
        name: 'url',
        label: 'RSS Feed URL',
        required: true,
      },
      {
        name: 'hr1',
        hr: true,
      },
      {
        name: 'text2',
        text: 'Some RSS Feed decline requests made directly by a browser. To circumvent this, you can provide a URL to a CORS relay server. This is not necessary in every case, only use this option if you have problems directly connecting to the RSS feed.',
      },
      {
        name: 'corsRelayUrl',
        label: 'CORS Relay URL',
      },
      {
        name: 'corsRelayApiKey',
        label: 'CORS Relay API Key',
      },
      {
        name: 'hr2',
        hr: true,
      },
      {
        name: 'compactView',
        type: 'checkbox',
        label: 'Compact View',
      },
    ];

    return <WrappedComponent {...props} fields={fields} />;
  };
};

export default withFieldProvider;
