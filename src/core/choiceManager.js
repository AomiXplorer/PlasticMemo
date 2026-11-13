/** Choice menu. Keyboard 1-9, tap, or click. Skip and Auto stop here. */
export class ChoiceManager {
  constructor(root, { audio }) {
    this.root = root;
    this.el = root.querySelector('#choice-layer');
    this.audio = audio;
    this.resolver = null;
    this.active = false;
    this._onKey = (e) => {
      if (!this.active) return;
      const n = Number(e.key);
      if (n >= 1 && n <= 9) {
        const btn = this.el.querySelector(`[data-index="${n - 1}"]`);
        btn?.click();
      }
    };
    window.addEventListener('keydown', this._onKey);
  }

  ask(prompt, options) {
    return new Promise((resolve) => {
      this.active = true;
      this.resolver = resolve;
      this.el.innerHTML = '';

      const wrap = document.createElement('div');
      wrap.className = 'choice-panel';

      if (prompt) {
        const p = document.createElement('p');
        p.className = 'choice-prompt';
        p.textContent = prompt;
        wrap.append(p);
      }

      options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'choice-btn';
        btn.dataset.index = String(i);
        btn.innerHTML = `<span class="choice-key">${i + 1}</span><span class="choice-text"></span>`;
        btn.querySelector('.choice-text').textContent = opt.text;
        btn.addEventListener('click', () => this.pick(i));
        wrap.append(btn);
      });

      this.el.append(wrap);
      this.root.classList.add('is-choosing');
      requestAnimationFrame(() => this.el.classList.add('is-on'));
      wrap.querySelector('.choice-btn')?.focus({ preventScroll: true });
    });
  }

  pick(index) {
    if (!this.active) return;
    const buttons = [...this.el.querySelectorAll('.choice-btn')];
    buttons.forEach((b) => b.classList.toggle('is-picked', Number(b.dataset.index) === index));
    this.audio?.playSfx('click');
    setTimeout(() => {
      this.el.classList.remove('is-on');
      this.root.classList.remove('is-choosing');
      setTimeout(() => { this.el.innerHTML = ''; }, 220);
      this.active = false;
      const r = this.resolver;
      this.resolver = null;
      r?.(index);
    }, 260);
  }
}
