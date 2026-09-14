declare const __APP_BASE_PATH__: string;

const basePath = __APP_BASE_PATH__;
const publicSiteOrigin = 'https://ruolinlin.github.io';
const publicSiteBasePath = '/student-strength-portrait';

export function appHref(path = '/') {
  return `${basePath}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Invitation URLs are deliberately pinned to the real public GitHub Pages
 * address. This keeps a locally opened page, preview, or sandbox from ever
 * putting an unusable development host into a QR code or copied invitation.
 */
export function publicAppHref(path = '/') {
  return `${publicSiteOrigin}${publicSiteBasePath}${path.startsWith('/') ? path : `/${path}`}`;
}

export function navigateTo(path: string) {
  window.location.assign(appHref(path));
}
