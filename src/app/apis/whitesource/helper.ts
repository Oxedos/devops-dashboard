const DEV = process.env.NODE_ENV !== 'production';

export function getWhitesourceError(error) {
  if (DEV) {
    return getWhitesourceErrorDev(error);
  } else {
    return getWhitesourceErrorProd(error);
  }
}

function getWhitesourceErrorDev(error) {
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

function getWhitesourceErrorProd(error) {
  if (!error) {
    return 'Something went wrong. Please try again later';
  }
  if (error.response) {
    const { status } = error.response;
    if (status === 401) {
      return 'Unauthorized. Are the credentials correct?';
    }
    if (status === 403) {
      return 'Access Denied. Does the user have access?';
    }
    if (status === 404) {
      return 'Not Found';
    }
    return 'Something went wrong. Please try again later';
  }
  return 'Something went wrong. Please try again later';
}
