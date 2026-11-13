# BEATS — 8 chapter

Baca `docs/STORY-BIBLE-v2.md` dulu. Semua angka baris itu target, bukan aturan mati.

Aturan teknis file chapter: lihat `src/story/ch01.js` (versi baru) sebagai contoh kanonik.
Import helper dari `./dsl.js`, export `chapter = chapterMeta({...}, [...])`.
Jalankan `node tools/validate-story.mjs` sampai 0 error sebelum selesai.

---

## Ch.01 — Orang Baru di Siaran Tengah Malam
Target ~150 baris. 2 pilihan.

**Tujuan Akira:** selesein shift tanpa masalah. (Sederhana, jelas.)

**Scene 1 — Studio 2, 23:12, hujan.**
Akira siaran. Baca surat pendengar soal "besok". Dia bagus di ini: santai, nggak
lebay, ngobrol kayak ke satu orang. Sisipin satu lelucon kering soal mixer tua.

**Scene 2 — Hina nerobos masuk.**
Hina panik-senang: hibah Suara Muda Sagara lolos, EVA-nya dateng malam ini,
berkas udah dia urus. Akira nolak. Hina jelasin taruhannya: program batal = dana
hangus = stasiun tutup. Ini wajib disebut eksplisit, jangan dibikin misterius.
Hina keluar buat jemput EVA-nya.

**Scene 3 — Mizuki masuk.**
Dia sopan, kaku, ngomongnya agak formal. Pertanyaan pertamanya: "Aku harus
manggil kamu apa?"
**PILIHAN 1** (prompt: "Mizuki nunggu jawaban."):
 a) "Akira aja. Nama gue." → `ch01Open`, bond +1
 b) "Nggak usah manggil apa-apa." → bond -1, honesty -1
 c) "Terserah kamu." → netral
Reply singkat per opsi (1–3 baris), reaksi Mizuki beda tiap opsi.

**Scene 4 — On air bareng.**
Latihan 30 detik. Dia beku, terus ngomong terlalu jujur di udara
("Aku belum pernah kena hujan. Aku cuma tahu suaranya."). Akira nyelametin
momennya dengan ngejek diri sendiri. Mizuki ngeliatin dia kayak baru ngerti
sesuatu. Jangan dibikin romantis dulu. Ini soal kompetensi.

**Scene 5 — Selesai siaran, 01:40.**
Masalah konkret: kamar EVA-nya belum siap sampai Senin. Hina nimpuk masalahnya
ke Akira lalu kabur. Mizuki nawarin diri buat nunggu di lobi. Akira nggak tega.
Dia kasih jaket, nyuruh duduk di kursi, dan ngasih tahu satu aturan: jangan
nyentuh alat siaran.

**Scene 6 — 04:00, hujan berhenti.**
Dia nanya kenapa hujan punya suara.
**PILIHAN 2** (prompt: "Jawab apa?"):
 a) Jawab jujur, nggak tahu → `ch01Walked`, bond +1, honesty +2
 b) Jawab seadanya, "ya karena air jatuh" → honesty -1, resolve +1
 c) Balik nanya dia → bond +1, honesty +1, resolve +1
**Penutup:** Mizuki tidur duduk. Akira mau bangunin, nggak jadi. Saat mode
istirahat, dia ngomong pelan satu kalimat setengah ngaco yang nunjuk ke hitungan
("Sisa hari ini masih bagus."). Akira nggak ngerti. Biarin player juga belum
ngerti, tapi jangan dibikin puitis. Hook: dia ngitung sesuatu.

---

## Ch.02 — Dunia Penuh Hal Kecil
Target ~160 baris. 2 pilihan.

**Tujuan Akira:** bertahan seminggu tanpa malu di udara.

**Scene 1 — Senin, sore, lobi.** EVA-nya resmi, Hina bikin papan jadwal baru.
Akira protes formal (nama program dll), Hina menang.

**Scene 2 — Minggu pertama, montase pendek 3 hari.** Mizuki belajar: salah
tekan tombol, ketuker nama file, ngitung pendengar (11 orang, dia bangga).
Komidi dari detail kecil, bukan dari kebodohan dia.

**Scene 3 — Hari libur.** Akira mau pergi sendiri. Hina maksa dia bawa Mizuki
("biar kalian kenal"). Mizuki pengen tahu kota.
**PILIHAN 1** (prompt: "Mau ke mana?"):
 a) Toko buku → `ch02Saved`, bond +2
 b) Festival kecil di lapangan → bond +2, honesty +1
 c) Jalan aja tanpa tujuan → bond +1, resolve +1

**Scene 4 — Di luar.** Tunjukin EVA di kehidupan biasa (kasir, perawat) tanpa
dijelasin. Akira nggak nyaman, dan ini kelihatan dari diamnya, bukan dari dia
ceramah. Mizuki nanya hal-hal yang bikin Akira harus mikir jawabannya
(kenapa orang bilang "hati-hati di jalan" kalau cuma jalan 100 meter).

**Scene 5 — Balik ke studio, malam.** Hina ngobrol berdua sama Akira: dia ngaku
ngambil kerjaan ini karena butuh, dan dia takut kalau programnya batal.
Sisi Hina jadi manusia, bukan comic relief.

**Scene 6 — Penutup.** Mizuki nanya arti "kangen".
**PILIHAN 2** (prompt: "Jelasin gimana?"):
 a) Jelasin pakai contoh ibunya → `ch02Saved` bond +2, honesty +2
 b) Bilang "susah dijelasin" → honesty -1
 c) Suruh dia nanya Hina → bond -1, resolve +1
**Hook:** satu kalimat dari Mizuki yang nunjukin dia nyatet hal-hal soal Akira
di log-nya sendiri. Akira ngeliat log itu sekilas. Belum dikomentarin.

---

## Ch.03 — Kenangan yang Kita Bikin
Target ~175 baris. 1 pilihan. Ini chapter emosional, jangan buru-buru.

**Tujuan Akira:** bikin program bulan pertama nggak gagal (rating kecil, tapi
pendengar nambah karena Mizuki aneh dan jujur di udara).

**Scene 1 — 3 minggu kemudian, studio, 00:20.** Programnya mulai ada pendengar
tetap. Ada yang kirim surat buat Mizuki. Dia baca dengan serius, terlalu serius.
Akira ngeledek, dia nggak ngerti, lucu.

**Scene 2 — Mizuki bikin "arsip kecil".** Dia rekam potongan suara: suara hujan,
suara Akira ketawa, suara pintu. Alasannya: "Kalau nanti aku lupa, aku masih
punya ini." Akira nanya "lupa gimana", dia jawab normatif (nggak tahu,
prosedurnya gitu). Ini foreshadow, jangan dijelasin.

**Scene 3 — Atap gedung, senja.** Ini scene inti. Akira cerita soal Kak Rani
(EVA pengasuh, di-shutdown waktu dia 12, diganti EVA baru yang katanya "sama").
Ceritain lewat detail konkret: kebiasaan Kak Rani, satu kalimat yang dia inget,
dan fakta bahwa EVA baru itu nggak inget apa-apa. Jangan pakai kata "jiwa".

**PILIHAN** (prompt: "Mizuki nanya: kamu percaya EVA baru itu orang yang sama?"):
 a) "Nggak. Buat gue itu bukan dia." → `toldAboutLove` honesty +3
 b) "Gue nggak tahu. Kadang gue pengen percaya." → honesty +2, bond +1
 c) "Udah lama. Nggak penting." → honesty -2, bond -1

**Scene 4 — Reaksi Mizuki.** Dia nggak ngehibur. Dia jawab dengan cara dia:
kalau dia di-shutdown dan ada versi baru, versi baru itu nggak akan tahu
kenapa Akira nggak suka kopi. Lalu dia bilang: "Berarti sekarang aku harus
lebih banyak nyatet." Akira kesel, bukan karena dia salah.

**Scene 5 — Glitch pertama.** Di studio, Mizuki ngulang satu kalimat yang sama
persis kayak 20 detik lalu. Akira nanya. Dia bilang sistemnya cuma "nunda
proses". Ketawa. Akira nggak ketawa.
**Hook:** malam itu dia nulis di log: "hari ini Akira ketawa dua kali."

---

## Ch.04 — Tiga Belas Bulan
Target ~160 baris. 1 pilihan.

**Tujuan Akira:** ngerti apa yang sebenarnya terjadi sama Mizuki.

**Scene 1 — Pagi, studio, Kaito dateng.** Kalibrasi 3 bulan. Kaito kaku, teknis,
nanya hal aneh ("dia pernah ngulang kalimat?"). Akira mulai curiga.

**Scene 2 — Kaito ngasih tahu.** Jangan dibikin dramatis. Kaito ngomong sambil
kerja, datar: EVA-07 udah 4 tahun 11 bulan dari 5 tahun masa aktifnya.
Sisa 13 bulan. Habis itu shutdown, memori dihapus. Ada transfer, tapi hasilnya
bukan orang yang sama. Kaito ngasih tahu karena itu prosedur, bukan karena baik.

**Scene 3 — Reaksi.** Akira marah ke orang yang salah: nyalahin Kaito, nyalahin
Hina (yang ternyata nggak tahu detail ini — dia cuma ngurus berkas hibah, bukan
kontrak EVA). Hina kaget dan ngerasa bersalah. Konflik antarmanusia, bukan
konflik sama sistem.

**Scene 4 — Mizuki ternyata udah tahu dari awal.** Dia nggak nyembunyiin.
Menurutnya semua EVA tahu. Dia nggak bilang karena nggak ada yang nanya.
Ini yang paling nyakitin Akira: bukan kebohongan, cuma nggak ditanya.

**PILIHAN** (prompt: "Kamu mau ngapain?"):
 a) Tanya Kaito semua soal transfer, sampai teknis → `askedKaitoTransfer`, `knowsCountdown`, resolve +3
 b) Tanya Mizuki langsung, apa dia mau → `askedMizukiDirectly`, `knowsCountdown`, bond +2, honesty +1
 c) Pura-pura nggak denger, lanjut siaran → `pretendedNotToKnow`, `knowsCountdown`, bond -1, honesty -2

**Scene 5 — Penutup.** Akira di kamar, 03:00. Ngitung 13 bulan dalam minggu.
Dapet 56 minggu. Nggak bisa tidur.
**Hook:** dia sadar dia udah mulai ngitung, dan itu artinya dia udah peduli.

---

## Ch.05 — Kalau Aku Bisa Tinggal
Target ~175 baris. 2 pilihan.

**Tujuan Akira:** bikin dia bertahan (dan dia nggak mau dibantuin soal itu).

**Scene 1 — Studio, malam, hujan.** Suasananya aneh: Mizuki sopan berlebihan.
Dia udah ngajuin permohonan pindah tugas ke stasiun lain, biar Akira nggak
kerepotan waktu dia habis. Berkasnya udah di mejanya Hina.

**PILIHAN 1** (prompt: "Dia udah ngajuin pindah. Kamu?"):
 a) "Batalin. Gue nggak minta lo pergi." → bond +2, honesty +1
 b) "Kalau itu yang lo mau, gue nggak bisa larang." → bond -1
 c) Marah, nyuruh dia berhenti ngurusin perasaan Akira → `pushedHerAway`, bond -3, honesty -1

**Scene 2 — Perang dingin.** Kalau dia nggak pergi (opsi a), mereka tetap
canggung. Mizuki jelasin alasannya: dia nggak mau jadi beban, dan dia udah
hitung (dia selalu ngitung) bahwa kepergiannya lebih ringan buat Akira.

**Scene 3 — Hina marahin Akira.** Hina ngasih perspektif: yang Mizuki takutin
bukan shutdown, tapi jadi orang yang bikin Akira sedih tiap hari.

**PILIHAN 2** (prompt: "Akira harus ngapain malam ini?"):
 a) Telepon Kaito, tanya apa ada cara lain → bond +1, resolve +3
 b) Ke kamar Mizuki, ngobrol tanpa tujuan → bond +3, honesty +2, `answeredKangen`
 c) Diam aja, besok juga sama → `avoidedKangen`, bond -2

**Scene 4 — Malam.** Kalau b, scene tenang: mereka ngobrolin hal nggak penting
(permen, nama bintang, kenapa kulkas berbunyi). Ini scene "kangen" yang dimaksud.
Kalau c, Akira di kamar sendirian, dan itu kerasa salah.
**Hook:** tanggal shutdown ditulis di kalender studio sama Hina pakai spidol merah.
Nggak ada yang ngomongin, tapi semua ngeliat.

---

## Ch.06 — Musim Panas Tanpa Akhir
Target ~190 baris. 2 pilihan.

**Tujuan Akira:** ngadepin musim panas + glitch yang makin sering + siaran
khusus akhir program yang bakal nentuin hibah tahun depan.

**Scene 1 — Musim panas, studio panas, kipas rusak.** Komidi ringan dulu.
Pendengar makin banyak (angka konkret: dari 11 ke 300an). Mizuki jadi favorit
karena dia jujur dan aneh.

**Scene 2 — Glitch makin parah.** Dia lupa nama jalan. Dia ngulang cerita yang
sama tiga kali dalam sehari. Akira nyatet semuanya di HP, dan dia nggak sadar
dia udah mulai nyatet kayak Mizuki nyatet.

**Scene 3 — Hina tahu.** Hina nemu catatan Akira / liat glitch langsung.
**PILIHAN 1** (prompt: "Hina nanya: ada apa sama dia?"):
 a) Jujur semua, termasuk soal 13 bulan → `sawGlitch`+`toldHinaGlitch`, honesty +3, bond +1
 b) Bohong, bilang cuma capek → `sawGlitch`, honesty -2
 c) Suruh Mizuki yang jawab sendiri → `sawGlitch`, bond +1, honesty +1

**Scene 4 — Siaran khusus akhir program diumumin** (akhir Agustus). Kalau
sukses, hibah lanjut. Kalau nggak, program bubar dan Mizuki ditarik.
Kaito dateng lagi: kalau mau coba transfer, harus dijadwalin sebelum shutdown,
dan risikonya dia nggak balik sebagai dirinya.

**PILIHAN 2** (prompt: "Soal transfer, kamu?"):
 a) "Jangan. Gue nggak mau ganti dia sama versi baru." → `summerWish`, bond +2, honesty +2
 b) "Kasih gue semua info teknisnya." → `summerWish`, resolve +3
 c) "Nanti aja. Masih ada waktu." → `summerWish`, bond -1

**Scene 5 — Malam, tepi laut / atap.** Janji kecil yang konkret: satu hal yang
mereka mau lakuin sebelum musim panas habis. Bukan janji besar.
**Hook:** Mizuki nanya, "Kalau aku lupa kamu, kamu bakal marah?" dan Akira
nggak jawab. Scene potong di situ.

---

## Ch.07 — Siaran Terakhir
Target ~185 baris. 2 pilihan. Ini fork ending.

**Tujuan Akira:** ngejalanin siaran terakhir tanpa menghancurkan semuanya.

**Scene 1 — Sore sebelum siaran.** Persiapan. Hina gelisah, Kaito dateng bawa
alat (kalau player mau transfer, ini malam terakhir bisa dijadwalin). Semua
serba cepat dan tegang.

**Scene 2 — Mizuki udah mutusin.** Dia mau shutdown normal. Alasannya jelas:
transfer bukan dia, dan dia nggak mau ada versi baru yang pakai namanya.
Dia minta satu hal: siaran terakhir dijalanin kayak biasa.

**PILIHAN 1** (prompt: "Kaito nunggu jawaban. Kamu?"):
 a) "Jalanin transfer. Gue nggak bisa kehilangan dia." → `askedKaitoTransfer`+`pushedTransfer`, resolve +3, bond -1
 b) "Nggak. Hormatin keputusan Mizuki." → `honoredHerWish`, bond +2, honesty +3
 c) "Gue nggak bisa mutusin sekarang." → `delayedDecision`, honesty -1

**Scene 3 — Siaran.** Ini puncak. Surat-surat pendengar, termasuk surat Akira
sendiri yang dia tulis tapi nggak pernah dikirim. Mizuki baca satu surat terakhir.
**PILIHAN 2** (prompt: "Ada 40 detik kosong di udara. Kamu?"):
 a) Ngomong apa adanya soal perasaan kamu → `saidItOnAir`, honesty +3
 b) Baca surat dia, jangan tambahin apa-apa → `ordinaryOnAir`, bond +2
 c) Diam, biarin lagu jalan → `silentOnAir`, honesty -2

**Scene 4 — Setelah siaran, 03:00.** Studio kosong. Ini scene pendek, tenang.
Mizuki ngasih satu benda (log/arsip kecilnya). Akira belum buka.
**Hook:** `endingGate` ke ending.

---

## Ch.08 — Until Your Last Memory
Target ~400 baris, 4 cabang, 0 pilihan. Tiap cabang ~90–110 baris, ditutup `ending('...')`.

Struktur wajib:
```
endingGate({ true: 'end_true', good: 'end_good', normal: 'end_normal', bad: 'end_bad' })
label('end_true') ... ending('true')
label('end_good') ... ending('good')
label('end_normal') ... ending('normal')
label('end_bad')  ... ending('bad')
```

**end_true** — Dia nggak mati, tapi bukan karena keajaiban. Kaito nemu satu
opsi: shutdown ditunda dengan cara "mode arsip" (dia berhenti jadi asisten,
jadi arsip hidup, fungsi turun, memori nggak dihapus). Akira harus ngorbanin
sesuatu yang konkret: stasiun kehilangan EVA-nya, jadi hibah batal, dan dia
kehilangan kerjaan yang dia satu-satunya punya. Mereka pilih itu bareng.
Akhir: radio kecil, dua orang, dan arsip yang masih bisa dipanggil.
Jangan bikin jadi happily ever after tanpa biaya. Biayanya nyata.

**end_good** — Shutdown tetap jalan. Tapi mereka habiskan 13 bulan itu dengan
bener: siaran, arsip, satu perjalanan. Di hari terakhir dia masih bisa ngomong,
dan yang dia bilang hal kecil, bukan pidato. Setelah itu Akira tetap siaran,
dan tiap malam terakhir bulan dia muter satu potongan suara dari arsip.

**end_normal** — Mereka nggak pernah ngomongin serius. Shutdown datang, Akira
kerja, hidup jalan. Bertahun kemudian dia denger rekaman lama di radio orang
lain dan baru sadar dia lupa suaranya. Ini ending paling dingin, bukan paling
sedih. Ditulis datar, tanpa drama.

**end_bad** — Akira maksa transfer, atau dia udah ngejauhin dia sebelumnya.
Hasilnya EVA baru dengan data lama: sopan, tahu faktanya, nggak kenal dia.
Kalau `pushedTransfer`, adegan di ruang perawatan. Kalau `pushedHerAway`,
adegan Akira sendirian di studio, dan programnya bubar.
Tulis dua varian kecil di dalam cabang ini pakai `when({ flag: 'pushedTransfer' }, ...)`.
