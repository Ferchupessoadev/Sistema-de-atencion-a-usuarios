const COOKIE_NAME = 'auth_token';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function readCookie(name) {
  const prefix = `${name}=`;
  const cookie = document.cookie
    .split('; ')
    .find(value => value.startsWith(prefix));

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}

export function getAuthToken() {
  return readCookie(COOKIE_NAME);
}

export function setAuthToken(token) {
  document.cookie = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    `Max-Age=${COOKIE_MAX_AGE}`,
    'Path=/',
    'SameSite=Strict',
    'Secure',
  ].join('; ');
}

export function clearAuthToken() {
  document.cookie = [
    `${COOKIE_NAME}=`,
    'Max-Age=0',
    'Path=/',
    'SameSite=Strict',
    'Secure',
  ].join('; ');
}
