# Until Your Last Memory

Visual novel anime orisinal. 8 chapter, 4 ending, Bahasa Indonesia sehari-hari.
Semua aset di dalam paket ini sudah jadi: tidak ada API call, tidak ada placeholder.

## Cara main (paling cepat)

```bash
# dari dalam folder ini
python3 -m http.server 4173
# buka http://localhost:4173
```

Jangan buka `index.html` lewat `file://` — ES module dan service worker butuh http.

## Deploy ke Vercel

Pilih salah satu:

1. **Drag & drop**: buka vercel.com/new, seret folder ini, Deploy. Selesai.
2. **CLI**: `npm i -g vercel` lalu `vercel --prod` di folder ini.

Sudah ada `vercel.json` (header cache untuk aset, `manifest` dan `sw.js` tidak di-cache
lama). Tidak perlu build step, ini situs statis biasa.

## Kontrol

| Aksi | Keyboard | Layar |
|---|---|---|
| Lanjut dialog | `Space` / `Enter` | klik di mana saja |
| Pilih opsi | `1`–`9` | klik tombol |
| Auto | `A` | tombol AUTO |
| Skip | `S` | tombol SKIP |
| Riwayat | `L` | tombol LOG |
| Tutup panel / menu | `Esc` | tombol MENU |
| Layar penuh | `F` | ikon di toolbar |

Di HP: game minta layar penuh + kunci landscape. Kalau perangkat menolak
(iPhone Safari), muncul overlay "Miringkan HP kamu" dan progres tetap aman.

## Struktur

```
index.html            shell + semua layar (menu, panel, log, ending, overlay)
styles/main.css       seluruh tampilan
src/main.js           bootstrap, error overlay, PWA
src/core/
  game.js             orkestrasi: layar, simpanan, pilihan, ending
  storyEngine.js      mesin alur (say, choice, branch, goto, endingGate)
  sceneRenderer.js    eksekusi token visual/audio
  dialogueSystem.js   typewriter, auto, skip, riwayat
  choiceManager.js    render pilihan + keyboard
  characterSprite.js  slot sprite, posisi, highlight pembicara
  expressionManager.js peta ekspresi + preload
  backgroundRenderer.js cross-fade background
  relationshipManager.js tiga sumbu (bond, honesty, resolve)
  endingManager.js    hitung ending dari poin + flag
  saveManager.js      6 slot + autosave + meta (gallery, chapter terbuka)
  audioManager.js     3 bus: bgm / ambience / sfx, volume terpisah
  voiceManager.js     suara karakter
  orientationManager.js / fullscreenManager.js
src/story/
  dsl.js              helper penulisan naskah
  characters.js       data karakter, warna nama, ekspresi
  ch01..ch08.js       naskah, terpisah penuh dari render
assets/               sprite, background, CG, audio, ikon
tools/                validator naskah, generator audio, simulator ending
docs/STORY-BIBLE.md   dunia, karakter, aturan bahasa
```

## Naskah

Naskah ditulis sebagai data, bukan HTML. Contoh:

```js
m('Aku denger hujan.', 'smile'),
a('Di sini hujan tiap malem.'),
choice('Jawab pertanyaan Mizuki?', [
  { text: 'Jawab jujur.', rp: { bond: 2, honesty: 3 }, reply: [m('...', 'surprise')] },
  { text: 'Jawab seadanya.', rp: { bond: -1 } },
]),
```

`tools/validate-story.mjs` mengecek: id karakter, id background/bgm/amb/sfx, ekspresi,
label `goto`, dan node yang tidak valid.

```bash
npm run validate
```

## Ending

Empat ending ditentukan poin tiga sumbu (`bond`, `honesty`, `resolve`, dihitung
sebagai rasio terhadap maksimum yang bisa didapat) plus flag keputusan penting.
Ambangnya ada di `src/core/endingManager.js` dan sengaja didokumentasikan.

`tools/simulate-endings.mjs` mencoba **semua** kombinasi pilihan:

```bash
node tools/simulate-endings.mjs
```

Sebaran terakhir: True 2,2% · Good 30,8% · Normal 35,6% · Bad 31,5% dari 531.441 jalur.
Semua ending terjangkau. True ending butuh pemain yang menyelidiki transfer memori
*sekaligus* menghormati keputusan Mizuki, jadi bukan hasil acak.

## Catatan aset

- Sprite: 26 file PNG transparan (WebP), half-body potong pinggang, 4 karakter.
  Mizuki punya 10 ekspresi. Dibuat dengan AI, chroma-key dibersihkan di
  `tools/prep_art.py`, ukuran kepala dinormalisasi per karakter (`spriteScale`).
- Background: 16 file 16:9 terpisah. Tidak ada gambar gabungan karakter+background.
- CG: 4 ilustrasi ending.
- Audio: 10 BGM, 8 ambience, 14 SFX. Semua disintesis dari nol oleh
  `tools/make_audio.py` (numpy), bukan sampel pihak ketiga, jadi bebas lisensi.
  Total audio 2,0 MB.
- Font: Shippori Mincho + Zen Kaku Gothic New dari Google Fonts, dengan fallback
  sistem (Georgia / Yu Mincho / sans-serif) kalau offline.

## QA shortcut

`index.html?ch=5&node=120` membuka chapter 5 di node tersebut. Dipakai untuk menguji
satu scene tanpa main dari awal.
