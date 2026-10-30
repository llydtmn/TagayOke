// Whole-page full screen helpers. Browsers only allow entering full screen from a tap or key press,
// so call enterPageFullscreen() straight from an event handler (before any await).
const root = () => document.documentElement;
export const fsActive = () => !!(document.fullscreenElement || document.webkitFullscreenElement);

export function enterPageFullscreen() {
  if (fsActive()) return;
  try {
    const req = root().requestFullscreen || root().webkitRequestFullscreen;
    const r = req?.call(root());
    if (r?.catch) r.catch(() => { /* refused (e.g. iPhone Safari): carry on without it */ });
  } catch { /* unsupported */ }
}

export function exitPageFullscreen() {
  if (!fsActive()) return;
  try {
    const r = (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
    if (r?.catch) r.catch(() => {});
  } catch { /* ignore */ }
}

// True while the browser is in full screen (the whole page or any element on it).
export const fsNow = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
