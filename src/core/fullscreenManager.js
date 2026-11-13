/** Fullscreen request with iOS fallbacks. Never throws into the game loop. */

export class FullscreenManager {
  constructor(target = document.documentElement) {
    this.target = target;
    this.supported = !!(
      target.requestFullscreen
      || target.webkitRequestFullscreen
      || target.webkitEnterFullscreen
    );
  }

  isActive() {
    return !!(
      document.fullscreenElement
      || document.webkitFullscreenElement
    );
  }

  async enter() {
    if (this.isActive()) return true;
    const el = this.target;
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen({ navigationUI: 'hide' });
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      } else {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  async exit() {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    } catch {
      /* ignore */
    }
  }

  toggle() {
    return this.isActive() ? this.exit() : this.enter();
  }

  onChange(cb) {
    const handler = () => cb(this.isActive());
    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('webkitfullscreenchange', handler);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      document.removeEventListener('webkitfullscreenchange', handler);
    };
  }
}
