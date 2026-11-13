/**
 * Landscape handling. Tries the Screen Orientation API, then falls back to a
 * rotate overlay. Never blocks play: the overlay only covers the viewport, the
 * engine keeps its state, and progress is never lost while it is shown.
 */

export class OrientationManager {
  constructor() {
    this.listeners = new Set();
    this.locked = false;
    this.overlay = null;
    this._onChange = () => this.emit();
    window.addEventListener('orientationchange', this._onChange);
    window.addEventListener('resize', this._onChange);
    if (window.screen?.orientation?.addEventListener) {
      window.screen.orientation.addEventListener('change', this._onChange);
    }
  }

  get isMobile() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
      || (navigator.maxTouchPoints > 1 && window.innerWidth < 1100);
  }

  get isPortrait() {
    const type = window.screen?.orientation?.type;
    if (type) return type.startsWith('portrait');
    return window.innerHeight > window.innerWidth;
  }

  get canLock() {
    return !!(window.screen?.orientation?.lock);
  }

  async lockLandscape() {
    if (!this.canLock) return false;
    try {
      await window.screen.orientation.lock('landscape');
      this.locked = true;
      this.emit();
      return true;
    } catch {
      this.locked = false;
      this.emit();
      return false;
    }
  }

  unlock() {
    if (!this.canLock || !this.locked) return;
    try {
      window.screen.orientation.unlock();
    } catch {
      /* ignore */
    }
    this.locked = false;
    this.emit();
  }

  /** True when the player must rotate the device before the scene is usable. */
  get needsRotation() {
    return this.isMobile && this.isPortrait;
  }

  onChange(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  emit() {
    for (const cb of this.listeners) cb(this.state());
  }

  state() {
    return {
      isMobile: this.isMobile,
      isPortrait: this.isPortrait,
      locked: this.locked,
      canLock: this.canLock,
      needsRotation: this.needsRotation,
    };
  }
}
