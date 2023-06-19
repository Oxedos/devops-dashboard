import axios from 'axios';
import { normalizeUrl } from '../apiHelper';
import { getWhitesourceError } from './helper';
import { WhitesourceProject, WhitesourceVulnerability } from './types';

export const API_SUFFIX = '/api/v1.3';

type WhiteSourceApiResponse = {
  projects: WhitesourceProject[];
  vulnerabilities: WhitesourceVulnerability[];
};

export async function getProjects(
  url: string,
  userKey: string,
  productToken: string,
): Promise<WhitesourceProject[]> {
  try {
    const response = await axios.post<WhiteSourceApiResponse>(
      normalizeUrl(url, API_SUFFIX),
      {
        requestType: 'getAllProjects',
        userKey,
        productToken,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data.projects;
  } catch (error) {
    throw new Error(getWhitesourceError(error));
  }
}

export async function getVulnerabilites(
  url: string,
  userKey: string,
  productToken: string,
): Promise<WhitesourceVulnerability[]> {
  try {
    const response = await axios.post<WhiteSourceApiResponse>(
      normalizeUrl(url, API_SUFFIX),
      {
        requestType: 'getProductVulnerabilityReport',
        userKey,
        productToken,
        format: 'json',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data.vulnerabilities;
  } catch (error) {
    throw new Error(getWhitesourceError(error));
  }
}
