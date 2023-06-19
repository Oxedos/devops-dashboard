function setProtocol(url: string, protocol: string) {
  if (!url) return '';
  let result = url;
  if (result.startsWith(protocol)) {
    return result;
  }
  if (result.startsWith('https://')) {
    result = result.slice(8, result.length);
  } else if (result.startsWith('http://')) {
    result = result.slice(7, result.length);
  }
  return `${protocol}://${result}`;
}

export function normalizeUrl(url: string, apiPath: string, protocol?: string) {
  if (!url) return '';
  let result = url;
  if (protocol) {
    result = setProtocol(result, protocol);
  }
  // if URL ends with a slash, remove it
  if (result.endsWith('/')) {
    result = result.slice(0, result.length - 1);
  }
  // now check if the url ends with the expected API Suffid
  if (result.endsWith(apiPath)) {
    return result;
  }
  return `${result}${apiPath}`;
}
