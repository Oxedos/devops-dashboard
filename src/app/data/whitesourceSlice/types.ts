import {
  WhitesourceProject,
  WhitesourceVulnerability,
} from 'app/apis/whitesource/types';

export interface WhitesourceState {
  configured: boolean;
  url: string | undefined;
  userKey: string | undefined;
  productToken: string | undefined;
  vulnerabilities: WhitesourceVulnerability[];
  projects: WhitesourceProject[];
}
