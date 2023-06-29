import { createGlobalStyle } from 'styled-components';

export const GlobalColours = {
  red: '#e55039',
  blue: '#4a69bd',
  green: '#78e08f',
  yellow: '#f6b93b',
  orange: '#e58e26',
  redLighter: '#eb644f',
  gray: '#a5b1c2',
  background: '#34495e',
  widget: '#2c3e50',
  white: '#ecebeb',
};

export const GlobalStyle = createGlobalStyle`
  html,
  body {
    height: 100%;
    width: 100%;
    --clr-background: #34495e;
    --clr-menu: #3c6382;
    --clr-widget: #2c3e50;
    --clr-red: #e55039;
    --clr-red-lighter: #eb644f;
    --clr-blue: #4a69bd;
    --clr-blue-lighter: #5b7ee0;
    --clr-green: #78e08f;
    --clr-green-lighter: #86f89f;
    --clr-orange: #e58e26;
    --clr-orange-lighter: #ffa12d;
    --clr-white: #ecebeb;
    --clr-gray: #a5b1c2;
    --clr-dark-gray: rgba(255, 255, 255, 0.15);
    --clr-yellow: #f6b93b;

    background: var(--clr-background);
    color: var(--clr-white);

    /* custom scrollbar */
    * {
        scrollbar-color: var(--clr-dark-gray) transparent;
        scrollbar-width: thin;
    }

    *::-webkit-scrollbar {
      width: 20px;
    }

    *::-webkit-scrollbar-track,
    *::-webkit-scrollbar-corner {
      background-color: transparent;
    }

    *::-webkit-scrollbar-thumb {
      background-color: var(--clr-dark-gray);
      border-radius: 20px;
      border: 6px solid transparent;
      background-clip: content-box;
    }

    *::-webkit-scrollbar-thumb:hover {
      background-color: var(--clr-gray);
    }
  }
  
  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  }

  #root {
    min-height: 100%;
    min-width: 100%;
  }

  p,
  label {
    font-family: Georgia, Times, 'Times New Roman', serif;
    line-height: 1.5em;
  }

  input, select {
    font-family: inherit;
    font-size: inherit;
  }

  .react-grid-placeholder {
    background: var(--clr-blue) !important;
  }

  // Pie Chart hover highligh colour
  .donut-chart-example {
    .rv-radial-chart__series--pie__slice:hover {
      stroke: black !important;
      stroke-width: 2px !important;
  }
}
`;
