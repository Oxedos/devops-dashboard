import axios, { RawAxiosRequestConfig } from 'axios';
const DEV = process.env.NODE_ENV !== 'production';

export function getGitLabErrorMessage(error) {
  if (DEV) {
    return getGitLabErrorMessageDev(error);
  } else {
    return getGitLabErrorMessageProd(error);
  }
}

function getGitLabErrorMessageDev(error) {
  if (!error) {
    return '[Unknown] No Error object received';
  }
  if (error.response) {
    const { data, status } = error.response;
    const dataSerialized = JSON.stringify(data);
    return `[${status}] ${dataSerialized}`;
  } else if (error.request) {
    return `[No Response] ${JSON.stringify(error.request)}`;
  } else {
    return `[Unknown] ${error.message}`;
  }
}

function getGitLabErrorMessageProd(error) {
  if (!error) {
    return 'Something went wrong. Please try again later';
  }
  if (error.response) {
    const { status } = error.response;
    if (status === 401) {
      return 'Unauthorized. Is the token correct?';
    }
    if (status === 403) {
      return 'Access Denied. Is the scope of the token set correctly?';
    }
    if (status === 404) {
      return 'Not Found';
    }
    return 'Something went wrong. Please try again later';
  }
  return 'Something went wrong. Please try again later';
}

function getLinks(links): any {
  if (!links) return {};
  const splitted = links.split(',');
  const parsed = {};
  for (let d of splitted) {
    let linkInfo = /<([^>]+)>;\s+rel="([^"]+)"/gi.exec(d);
    if (linkInfo === null) continue;
    parsed[linkInfo[2]] = linkInfo[1];
  }
  return parsed;
}

export async function getWithKeysetPagination(
  initialLink,
  config?: RawAxiosRequestConfig | undefined,
) {
  const pageSize = 20;
  try {
    const responseData: any[] = [];
    let link = initialLink;
    let paginationCall = false;
    do {
      const requestConfig: any = paginationCall
        ? { headers: config?.headers }
        : {
            ...config,
            headers: {
              pagination: 'keyset',
              per_page: pageSize,
              ...config?.headers,
            },
          };
      let response: any = await axios.get(link, requestConfig);
      responseData.push(...response.data);
      if (response.data && response.data.length >= pageSize) {
        link = getLinks(response.headers['link']).next;
      } else {
        link = undefined;
      }
      paginationCall = true;
    } while (link);
    return responseData;
  } catch (error) {
    throw new Error(getGitLabErrorMessage(error));
  }
}
