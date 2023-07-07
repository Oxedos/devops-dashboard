import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faAtlassian,
  faGitlab,
  faRedhat,
} from '@fortawesome/free-brands-svg-icons';
import {
  faBars,
  faChartLine,
  faChartPie,
  faCheck,
  faChevronLeft,
  faChevronRight,
  faCircle,
  faClock,
  faCodeBranch,
  faCodeCommit,
  faCodeMerge,
  faCodePullRequest,
  faCog,
  faCogs,
  faComment,
  faExclamation,
  faExclamationCircle,
  faExclamationTriangle,
  faFlag,
  faForward,
  faHome,
  faInfoCircle,
  faLongArrowAltLeft,
  faLongArrowAltRight,
  faMagnifyingGlass,
  faPause,
  faPenToSquare,
  faPlay,
  faPlus,
  faQuestion,
  faRssSquare,
  faShareSquare,
  faSlash,
  faSpinner,
  faSquare,
  faSquareCheck,
  faStream,
  faSync,
  faTable,
  faTachometerAlt,
  faTimes,
  faTrash,
  faUpRightFromSquare,
  faUser,
  faUserGear,
  faUserPlus,
  faCircleInfo,
} from '@fortawesome/free-solid-svg-icons';

import {
  faSquare as farSquare,
  faSquareCheck as farSquareCheck,
} from '@fortawesome/free-regular-svg-icons';

const customMetric: any = {
  prefix: 'fab',
  iconName: 'metric',
  icon: [
    16,
    16,
    [],
    'f36c',
    'M6.532 7.34a2.161 2.161 0 112.936 0 2.746 2.746 0 11-2.936 0zM2 0h12a2 2 0 012 2v12a2 2 0 01-2 2H2a2 2 0 01-2-2V2a2 2 0 012-2zm0 1a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V2a1 1 0 00-1-1H2zm6 5.915a1.161 1.161 0 100-2.322 1.161 1.161 0 000 2.322zm0 4.492a1.746 1.746 0 100-3.492 1.746 1.746 0 000 3.492z',
  ],
};

const pipeline: any = {
  prefix: 'custom',
  iconName: 'pipeline',
  icon: [
    40,
    40,
    [],
    'f36c',
    'M40,30a2,2,0,0,0-2,2v1H22a2,2,0,0,1,0-4h4A12,12,0,0,0,26,5H10V4A2,2,0,0,0,6,4V16a2,2,0,0,0,4,0V15H26a2,2,0,0,1,0,4H22a12,12,0,0,0,0,24H38v1a2,2,0,0,0,4,0V32A2,2,0,0,0,40,30Z',
  ],
};

export function loadIcons() {
  library.add(
    faTachometerAlt,
    faCogs,
    faCog,
    faPlus,
    faTimes,
    faSync,
    faExclamationTriangle,
    faExclamationCircle,
    faInfoCircle,
    faTrash,
    faCircle,
    faCheck,
    faForward,
    faSpinner,
    faUser,
    faClock,
    faBars,
    faHome,
    faGitlab,
    faAtlassian,
    faRedhat,
    faPause,
    faTable,
    faChartPie,
    faStream,
    faRssSquare,
    faExclamation,
    faLongArrowAltLeft,
    faLongArrowAltRight,
    faShareSquare,
    faSlash,
    faChevronLeft,
    faChevronRight,
    faChartLine,
    faUpRightFromSquare,
    faPlay,
    faCodeMerge,
    faCodePullRequest,
    faCodeBranch,
    faComment,
    faUserPlus,
    faCodeCommit,
    faUserGear,
    faMagnifyingGlass,
    faQuestion,
    faFlag,
    faSquare,
    faSquareCheck,
    farSquare,
    farSquareCheck,
    faPenToSquare,
    faCircleInfo,
  );

  // custom SVGs
  library.add(customMetric, pipeline);
}
