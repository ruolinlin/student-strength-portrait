declare const __APP_BASE_PATH__: string;

const basePath = __APP_BASE_PATH__;

export function appHref(path = '/') {
  return `${basePath}${path.startsWith('/') ? path : `/${path}`}`;
}

export function navigateTo(path: string) {
  window.location.assign(appHref(path));
}
