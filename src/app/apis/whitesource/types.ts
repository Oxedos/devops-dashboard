export type WhitesourceProject = {
  projectId: number;
  projectName: string;
};

export enum WhitesourceVulnerabilitySeverity {
  high = 'high',
  medium = 'medium',
  low = 'low',
}

export type WhitesourceVulnerability = {
  name: string;
  type: string;
  severity: WhitesourceVulnerabilitySeverity;
  score: string;
  cvss3_severity: string;
  cvss3_score: string;
  publishDate: string;
  lastUpdatedDate: string;
  scoreMetadataVector: string;
  url: string;
  description: string;
  project: string;
  product: string;
  cvss3Attributes: {
    attackVector: string;
    attackComplexity: string;
    userInteraction: string;
    privilegesRequired: string;
    scope: string;
    confidentialityImpact: string;
    integrityImpact: string;
    availabilityImpact: string;
  };
  library: {
    keyUuid: string;
    filename: string;
    type: string;
    description: string;
    sha1: string;
    name: string;
    artifactId: string;
    version: string;
    groupId: string;
    architecture: string;
    languageVersion: string;
  };
  topFix: {
    vulnerability: string;
    type: string;
    origin: string;
    url: string;
    fixResolution: string;
    date: string;
    message: string;
  };
};
