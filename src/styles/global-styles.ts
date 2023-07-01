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
  menu: '#3c6382',
};

export const GlobalStyle = createGlobalStyle`
  html,
  body {
    height: 100%;
    width: 100%;
    --clr-background: ${GlobalColours.background};
    --clr-menu: ${GlobalColours.menu};
    --clr-widget: ${GlobalColours.widget};
    --clr-red:  ${GlobalColours.red};
    --clr-red-lighter: #eb644f;
    --clr-blue:  ${GlobalColours.blue};
    --clr-blue-lighter: #5b7ee0;
    --clr-green: ${GlobalColours.green};
    --clr-green-lighter: #86f89f;
    --clr-orange:  ${GlobalColours.orange};
    --clr-orange-lighter: #ffa12d;
    --clr-white:  ${GlobalColours.white};
    --clr-gray:  ${GlobalColours.gray};
    --clr-dark-gray: rgba(255, 255, 255, 0.15);
    --clr-yellow:  ${GlobalColours.yellow};

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

  #root {
    min-height: 100%;
    min-width: 100%;
  }

  p,
  label {
    line-height: 1.5em;
  }

  .react-grid-placeholder {
    background: var(--clr-blue) !important;
  }
`;
