/** Every screen that is not the game loop: menus, panels, log, gallery, ending. */
import { CHAPTERS, ENDING_META, ENDING_ORDER } from '../story/index.js';
import { BACKGROUNDS, BGM, AMB, SFX } from '../story/characters.js';

const GALLERY = [
  { id: 'cg_true', label: 'A Memory That Stays', file: 'cg_true.webp' },
  { id: 'cg_good', label: 'Our Last Broadcast', file: 'cg_good.webp' },
  { id: 'cg_normal', label: 'The Voice in My Memory', file: 'cg_normal.webp' },
  { id: 'cg_bad', label: 'An Unanswered Frequency', file: 'cg_bad.webp' },
];

const CREDITS = `
  <div class="credits">
    <h3>Until Your Last Memory</h3>
    <p>Visual novel original, dibuat dari nol. Delapan chapter, empat ending, satu radio kecil di kota Sagara.</p>

    <h3>Tim</h3>
    <p>Cerita, naskah, dan arah cerita: ditulis untuk project ini.</p>
    <p>Mesin permainan, antarmuka, dan sistem simpanan: HTML, CSS, dan JavaScript modular tanpa framework.</p>
    <p>Ilustrasi karakter dan latar: dibuat khusus untuk project ini.</p>
    <p>Musik dan ambience: disusun khusus untuk project ini.</p>

    <h3>Catatan</h3>
    <p class="fine">Cerita ini original. Tidak ada karakter, adegan, dialog, atau desain dunia yang diambil dari karya lain. Inspirasi temanya adalah hubungan manusia dengan mesin yang punya batas waktu, dan itu dikerjakan sebagai cerita sendiri.</p>
    <p class="fine">Kalau kamu memakai penyintesis suara bawaan browser, kualitas suaranya tergantung perangkat kamu. Kamu bisa mematikannya di Settings.</p>

    <h3>Kontrol</h3>
    <p class="fine">Klik atau tap untuk lanjut. Spasi atau Enter juga bisa. Angka 1-9 memilih pilihan. A untuk Auto, S untuk Skip, L untuk Log, F untuk layar penuh, Esc untuk menu.</p>
  </div>
`;

export class Screens {
  constructor(game) {
    this.game = game;
    this.root = game.root;
    this.screenMenu = this.root.querySelector('#screen-menu');
    this.stage = this.root.querySelector('#stage');
    this.panel = this.root.querySelector('#panel');
    this.panelTitle = this.root.querySelector('#panel-title');
    this.panelBody = this.root.querySelector('#panel-body');
    this.logView = this.root.querySelector('#log-view');
    this.logBody = this.root.querySelector('#log-body');
    this.endingScreen = this.root.querySelector('#screen-ending');
    this.toast = this.root.querySelector('#toast');

    this.panel.addEventListener('click', (e) => {
      if (e.target.closest('[data-close-panel]')) this.closeAll();
    });
    this.logView.addEventListener('click', (e) => {
      if (e.target.closest('[data-close-log]')) this.closeAll();
    });
    this.toastTimer = null;
  }

  /* -------------------------------- state -------------------------------- */

  enterGame() {
    this.screenMenu.classList.remove('is-active');
    this.endingScreen.classList.remove('is-active');
    this.stage.classList.add('is-dialogue-on');
    this.closeAll();
  }

  showMenu() {
    this.stage.classList.remove('is-dialogue-on');
    this.endingScreen.classList.remove('is-active');
    this.screenMenu.classList.add('is-active');
    this.refreshMenu();
  }

  closeAll() {
    this.panel.classList.remove('is-open');
    this.logView.classList.remove('is-open');
    this.panelBody.innerHTML = '';
  }

  anyPanelOpen() {
    return this.panel.classList.contains('is-open')
      || this.logView.classList.contains('is-open')
      || this.endingScreen.classList.contains('is-active');
  }

  showNotice(msg, ms = 2600) {
    this.toast.textContent = msg;
    this.toast.classList.add('is-on');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.classList.remove('is-on'), ms);
  }

  refreshMenu() {
    const note = this.root.querySelector('#continue-note');
    const latest = this.game.saves.latest();
    if (note) {
      if (latest) {
        const ch = CHAPTERS.find((c) => c.id === latest.chapterId);
        const d = new Date(latest.savedAt);
        note.textContent = `Ch. ${String(latest.chapterId).padStart(2, '0')} · ${ch?.title ?? ''} · ${d.toLocaleDateString('id-ID')}`;
      } else {
        note.textContent = 'Belum ada simpanan';
      }
    }
    const cont = this.root.querySelector('[data-menu="continue"]');
    if (cont) cont.disabled = !latest;
    const load = this.root.querySelector('[data-menu="load"]');
    if (load) load.disabled = false;

    const progress = this.root.querySelector('#menu-progress');
    if (progress) {
      const reached = this.game.saves.meta.reached ?? 1;
      const endings = Object.keys(this.game.saves.endings()).length;
      progress.textContent = `Chapter terbuka ${reached} / ${CHAPTERS.length} · Ending ${endings} / 4`;
    }
  }

  updateChip() { /* chapter chip lives in the toolbar; kept for the engine hook */ }

  /* -------------------------------- panels -------------------------------- */

  openPanel(kind, opts = {}) {
    this.logView.classList.remove('is-open');
    this.panelBody.innerHTML = '';
    const titles = {
      settings: 'Settings',
      save: 'Simpan Permainan',
      load: 'Muat Permainan',
      chapters: 'Chapter Selection',
      gallery: 'Gallery',
      credits: 'Credits',
      menu: 'Menu',
    };
    this.panelTitle.textContent = titles[kind] ?? 'Menu';

    if (kind === 'settings') this.renderSettings();
    else if (kind === 'save') this.renderSlots('save');
    else if (kind === 'load') this.renderSlots('load');
    else if (kind === 'chapters') this.renderChapters();
    else if (kind === 'gallery') this.renderGallery();
    else if (kind === 'credits') this.panelBody.innerHTML = CREDITS;
    else if (kind === 'menu') this.renderGameMenu();

    this.panel.classList.add('is-open');
    if (opts.focus) this.panelBody.querySelector('button, input')?.focus({ preventScroll: true });
  }

  renderGameMenu() {
    const items = [
      ['Lanjutkan', () => this.closeAll()],
      ['Simpan', () => { this.closeAll(); this.openPanel('save'); }],
      ['Muat', () => { this.closeAll(); this.openPanel('load'); }],
      ['Log', () => { this.closeAll(); this.showLog(); }],
      ['Settings', () => { this.closeAll(); this.openPanel('settings'); }],
      ['Gallery', () => { this.closeAll(); this.openPanel('gallery'); }],
      ['Chapter Selection', () => { this.closeAll(); this.openPanel('chapters'); }],
      ['Kembali ke Title', () => this.game.toMenu()],
    ];
    const list = document.createElement('div');
    list.className = 'menu-list';
    for (const [label, fn] of items) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'menu-item';
      b.innerHTML = '<span class="menu-label"></span>';
      b.querySelector('.menu-label').textContent = label;
      b.addEventListener('click', fn);
      list.append(b);
    }
    list.style.maxWidth = '520px';
    this.panelBody.append(list);
  }

  renderSettings() {
    const s = this.game.settings;
    const body = this.panelBody;

    const group = (title) => {
      const g = document.createElement('div');
      g.className = 'set-group';
      const h = document.createElement('h3');
      h.textContent = title;
      g.append(h);
      body.append(g);
      return g;
    };

    const slider = (parent, label, hint, key, min, max, step) => {
      const row = document.createElement('div');
      row.className = 'set-row';
      row.innerHTML = `<div><span class="set-label">${label}</span><span class="set-hint">${hint}</span></div>`;
      const input = document.createElement('input');
      input.type = 'range';
      input.min = min; input.max = max; input.step = step;
      input.value = s[key];
      input.addEventListener('input', () => {
        this.game.patchSettings({ [key]: Number(input.value) });
      });
      row.append(input);
      parent.append(row);
    };

    const toggle = (parent, label, hint, key) => {
      const row = document.createElement('div');
      row.className = 'set-row';
      row.innerHTML = `<div><span class="set-label">${label}</span><span class="set-hint">${hint}</span></div>`;
      const sw = document.createElement('button');
      sw.type = 'button';
      sw.className = `switch${s[key] ? ' is-on' : ''}`;
      sw.setAttribute('aria-pressed', String(!!s[key]));
      sw.addEventListener('click', () => {
        const next = !this.game.settings[key];
        this.game.patchSettings({ [key]: next });
        sw.classList.toggle('is-on', next);
        sw.setAttribute('aria-pressed', String(next));
      });
      row.append(sw);
      parent.append(row);
    };

    /* text */
    const gText = group('Teks');
    const rowSpeed = document.createElement('div');
    rowSpeed.className = 'set-row';
    rowSpeed.innerHTML = '<div><span class="set-label">Kecepatan teks</span><span class="set-hint">Pelan, normal, cepat</span></div>';
    const seg = document.createElement('div');
    seg.className = 'seg';
    [['Pelan', 44], ['Normal', 26], ['Cepat', 12], ['Instan', 1]].forEach(([label, value]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.classList.toggle('is-on', Math.abs(this.game.settings.textSpeed - value) < 3);
      b.addEventListener('click', () => {
        this.game.patchSettings({ textSpeed: value });
        [...seg.children].forEach((c) => c.classList.remove('is-on'));
        b.classList.add('is-on');
      });
      seg.append(b);
    });
    rowSpeed.append(seg);
    gText.append(rowSpeed);

    /* audio */
    const gAudio = group('Suara');
    slider(gAudio, 'BGM', 'Musik latar', 'bgm', 0, 1, 0.05);
    slider(gAudio, 'Ambience', 'Hujan, kota, kereta', 'amb', 0, 1, 0.05);
    slider(gAudio, 'Efek suara', 'Klik, radio, pintu', 'sfx', 0, 1, 0.05);
    slider(gAudio, 'Voice', 'Volume suara karakter', 'voice', 0, 1, 0.05);
    toggle(gAudio, 'Voice karakter', 'Suara per karakter lewat penyintesis perangkat', 'voiceEnabled');
    toggle(gAudio, 'Suara narasi', 'Narasi ikut dibacakan', 'voiceNarration');
    toggle(gAudio, 'Bisu total', 'Semua audio dimatikan', 'muted');

    /* display */
    const gDisp = group('Layar');
    const rowFs = document.createElement('div');
    rowFs.className = 'set-row';
    rowFs.innerHTML = '<div><span class="set-label">Layar penuh</span><span class="set-hint">Disarankan di HP, posisi mendatar</span></div>';
    const fsBtn = document.createElement('button');
    fsBtn.type = 'button';
    fsBtn.className = 'btn-ghost';
    fsBtn.textContent = 'Aktifkan';
    fsBtn.addEventListener('click', () => this.game.toggleFullscreen());
    rowFs.append(fsBtn);
    gDisp.append(rowFs);

    const rowRot = document.createElement('div');
    rowRot.className = 'set-row';
    rowRot.innerHTML = '<div><span class="set-label">Kunci mendatar</span><span class="set-hint">Butuh dukungan browser</span></div>';
    const rotBtn = document.createElement('button');
    rotBtn.type = 'button';
    rotBtn.className = 'btn-ghost';
    rotBtn.textContent = 'Coba';
    rotBtn.addEventListener('click', async () => {
      const ok = await this.game.orientation.lockLandscape();
      this.showNotice(ok ? 'Orientasi dikunci mendatar.' : 'Browser ini nggak bisa mengunci orientasi. Miringkan HP manual ya.');
    });
    rowRot.append(rotBtn);
    gDisp.append(rowRot);

    /* data */
    const gData = group('Data');
    const rowReset = document.createElement('div');
    rowReset.className = 'set-row';
    rowReset.innerHTML = '<div><span class="set-label">Hapus semua progres</span><span class="set-hint">Simpanan, gallery, dan ending</span></div>';
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'btn-ghost';
    resetBtn.textContent = 'Hapus';
    resetBtn.addEventListener('click', () => {
      if (!window.confirm('Hapus semua simpanan dan progres? Ini nggak bisa dibatalkan.')) return;
      localStorage.removeItem('uylm.saves.v1');
      localStorage.removeItem('uylm.meta.v1');
      this.game.saves = new (this.game.saves.constructor)();
      this.refreshMenu();
      this.closeAll();
      this.showNotice('Semua progres dihapus.');
    });
    rowReset.append(resetBtn);
    gData.append(rowReset);
  }

  renderSlots(mode) {
    const grid = document.createElement('div');
    grid.className = 'slot-grid';
    const slots = this.game.saves.list();
    for (const [id, payload] of slots) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'slot';
      btn.dataset.slot = String(id);
      const label = id === 'auto' ? 'Auto' : `Slot ${id}`;
      if (!payload) {
        btn.innerHTML = `<div class="slot-top"><span class="slot-id">${label}</span></div><div class="slot-title">Kosong</div><div class="slot-preview">Belum ada data</div>`;
        if (mode === 'load') btn.disabled = true;
      } else {
        const d = new Date(payload.savedAt);
        const when = `${d.toLocaleDateString('id-ID')} ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
        btn.innerHTML = `<div class="slot-top"><span class="slot-id">${label}</span><span class="slot-time">${when}</span></div>
          <div class="slot-title"></div><div class="slot-preview"></div>`;
        btn.querySelector('.slot-title').textContent = `Ch. ${String(payload.chapterId).padStart(2, '0')} · ${payload.chapterTitle ?? ''}`;
        btn.querySelector('.slot-preview').textContent = payload.preview || 'Tidak ada pratinjau';
      }
      btn.addEventListener('click', async () => {
        if (mode === 'save') {
          if (id === 'auto') { this.showNotice('Slot auto diisi otomatis.'); return; }
          this.game.saveSlot(Number(id));
          this.renderSlots('save');
        } else {
          const payload = this.game.saves.load(id);
          if (!payload) return;
          await this.game.loadPayload(payload);
        }
      });
      grid.append(btn);
    }
    this.panelBody.append(grid);
  }

  refreshSlots() { /* the panel re-renders itself on save */ }

  renderChapters() {
    const reached = this.game.saves.meta.reached ?? 1;
    const list = document.createElement('div');
    list.className = 'ending-list';
    for (const ch of CHAPTERS) {
      const unlocked = ch.id <= reached;
      const row = document.createElement('button');
      row.type = 'button';
      row.className = `slot${unlocked ? '' : ' is-locked'}`;
      row.style.width = '100%';
      row.innerHTML = `<div class="slot-top"><span class="slot-id">Ch. ${String(ch.id).padStart(2, '0')}</span>
        <span class="slot-time">${unlocked ? 'Terbuka' : 'Belum terbuka'}</span></div>
        <div class="slot-title"></div><div class="slot-preview"></div>`;
      row.querySelector('.slot-title').textContent = ch.title;
      row.querySelector('.slot-preview').textContent = ch.subtitle ?? '';
      row.disabled = !unlocked;
      if (unlocked) {
        row.addEventListener('click', async () => {
          this.closeAll();
          await this.game.requestLandscape();
          await this.game.loadPayload({
            chapterId: ch.id, chapterTitle: ch.title, nodeIndex: 0,
            rp: { bond: 0, honesty: 0, resolve: 0 },
            possible: { bond: 0, honesty: 0, resolve: 0 },
            flags: {}, history: [],
          });
        });
      }
      list.append(row);
    }
    this.panelBody.append(list);
    const note = document.createElement('p');
    note.className = 'set-hint';
    note.style.marginTop = '16px';
    note.textContent = 'Memulai dari chapter tertentu memakai poin hubungan kosong, jadi ending-nya nggak akan sama dengan playthrough penuh.';
    this.panelBody.append(note);
  }

  renderGallery() {
    const unlocked = this.game.saves.gallery();
    const endings = this.game.saves.endings();

    const wrap = document.createElement('div');
    const grid = document.createElement('div');
    grid.className = 'gallery-grid';
    for (const item of GALLERY) {
      const has = !!unlocked[item.id];
      const cell = document.createElement('div');
      cell.className = `gal-item${has ? '' : ' is-locked'}`;
      if (has) {
        const img = document.createElement('img');
        img.src = `assets/cg/${item.file}`;
        img.alt = item.label;
        img.loading = 'lazy';
        cell.append(img);
        const cap = document.createElement('span');
        cap.className = 'gal-caption';
        cap.textContent = item.label;
        cell.append(cap);
      } else {
        cell.textContent = 'Terkunci';
      }
      grid.append(cell);
    }
    wrap.append(grid);

    const h = document.createElement('h3');
    h.textContent = 'Ending';
    h.style.cssText = 'font-family:var(--font-display);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--amber);margin:26px 0 8px;';
    wrap.append(h);

    const list = document.createElement('div');
    list.className = 'ending-list';
    for (const id of ENDING_ORDER) {
      const meta = ENDING_META[id];
      const has = !!endings[id];
      const row = document.createElement('div');
      row.className = `ending-row${has ? '' : ' is-locked'}`;
      row.innerHTML = `<span class="ending-tag">${id === 'true' ? 'True' : id === 'good' ? 'Good' : id === 'normal' ? 'Normal' : 'Bad'}</span>
        <div><div class="ending-name"></div><div class="ending-desc"></div></div>`;
      row.querySelector('.ending-name').textContent = has ? meta.title : '???';
      row.querySelector('.ending-desc').textContent = has ? meta.line : 'Belum kamu temukan.';
      list.append(row);
    }
    wrap.append(list);
    this.panelBody.append(wrap);
  }

  /* -------------------------------- log -------------------------------- */

  showLog() {
    this.panel.classList.remove('is-open');
    this.logBody.innerHTML = '';
    const entries = this.game.state.history.slice(-120);
    if (!entries.length) {
      this.logBody.innerHTML = '<p class="set-hint">Belum ada percakapan.</p>';
    }
    for (const entry of entries) {
      const div = document.createElement('div');
      div.className = 'log-entry';
      const who = entry.who === 'pilihan' ? 'Pilihan kamu' : entry.voiceLabel
        ? entry.voiceLabel
        : (entry.who ? entry.who : 'Narasi');
      div.innerHTML = '<div class="log-who"></div><p class="log-text"></p>';
      div.querySelector('.log-who').textContent = who;
      div.querySelector('.log-text').textContent = entry.text;
      this.logBody.append(div);
    }
    this.logView.classList.add('is-open');
    this.logBody.scrollTop = this.logBody.scrollHeight;
  }

  /* -------------------------------- cards -------------------------------- */

  showChapterCard(next) {
    const card = document.createElement('div');
    card.style.cssText = 'position:absolute;inset:0;z-index:35;display:grid;place-items:center;background:rgba(6,5,8,.92);animation:panelIn 180ms ease;';
    card.innerHTML = `<div style="text-align:center">
      <p style="font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:var(--amber);margin:0 0 10px">Chapter ${String(next.id).padStart(2, '0')}</p>
      <h2 style="font-family:var(--font-display);font-size:clamp(22px,3vw,38px);font-weight:500;margin:0 0 6px"></h2>
      <p style="font-family:var(--font-display);font-size:13px;letter-spacing:.1em;color:var(--paper-faint);margin:0"></p>
    </div>`;
    card.querySelector('h2').textContent = next.title;
    card.querySelector('p:last-child').textContent = next.subtitle ?? '';
    this.stage.append(card);
    setTimeout(() => {
      card.style.transition = 'opacity 400ms ease';
      card.style.opacity = '0';
      setTimeout(() => card.remove(), 420);
    }, 1700);
  }

  showEnding(id, stats, state) {
    const meta = ENDING_META[id];
    this.root.querySelector('#ending-title').textContent = meta.title;
    this.root.querySelector('#ending-sub').textContent = meta.subtitle;
    this.root.querySelector('#ending-line').textContent = meta.line;

    const statsEl = this.root.querySelector('#ending-stats');
    statsEl.innerHTML = '';
    const add = (value, label) => {
      const d = document.createElement('div');
      d.className = 'stat';
      d.innerHTML = '<span class="stat-v"></span><span class="stat-k"></span>';
      d.querySelector('.stat-v').textContent = `${value}%`;
      d.querySelector('.stat-k').textContent = label;
      statsEl.append(d);
    };
    add(stats.bond, 'Kedekatan');
    add(stats.honesty, 'Kejujuran');
    add(stats.resolve, 'Usaha');
    const lines = state.history.filter((h) => h.who === 'pilihan').length;
    add(lines, 'Pilihan');

    this.stage.classList.remove('is-dialogue-on');
    this.endingScreen.classList.add('is-active');
    this.refreshMenu();
  }
}
