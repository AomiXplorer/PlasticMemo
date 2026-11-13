/** Character registry — display identity only. Sprites live in /assets/sprites. */

export const EXPRESSIONS = [
  'neutral', 'happy', 'smile', 'shy', 'blush',
  'sad', 'cry', 'surprise', 'embarrass', 'angry',
];

export const CHARACTERS = {
  akira: {
    name: 'Akira', full: 'Akira Nishimura', age: 18,
    color: '#c9d6e4', role: 'MC', spriteScale: 1.02,
    // Voice channel params (Web Speech fallback when no recorded lines exist)
    voice: { pitch: 0.85, rate: 0.95 },
  },
  mizuki: {
    name: 'Mizuki', full: 'EVA-07 "Mizuki"', age: 17,
    color: '#e8c07d', role: 'EVA', spriteScale: 1.0,
    voice: { pitch: 1.35, rate: 1.02 },
  },
  hina: {
    name: 'Hina', full: 'Hina Sakura', age: 18,
    color: '#e79aa8', role: 'staff', spriteScale: 0.874,
    voice: { pitch: 1.18, rate: 1.12 },
  },
  kaito: {
    name: 'Kaito', full: 'Kaito Muroi', age: 19,
    color: '#9dc3b8', role: 'tech', spriteScale: 1.116,
    voice: { pitch: 0.75, rate: 0.92 },
  },
};

/** Backgrounds that exist as files. `id` is what story files pass to bg(). */
export const BACKGROUNDS = {
  'studio_night':      'Radio Aster — Studio 2, malam',
  'studio_evening':    'Radio Aster — Studio 2, senja',
  'radio_booth':       'Ruang siar Radio Aster',
  'radio_lobby':       'Lobi Radio Aster',
  'akira_room':        'Kamar Akira',
  'city_street_night': 'Jalanan kota, malam',
  'city_street_dusk':  'Jalanan kota, senja',
  'cafe':              'Kafe kecil',
  'train_station':     'Stasiun kereta',
  'train_interior':    'Dalam kereta',
  'bookstore':         'Toko buku',
  'summer_festival':   'Festival musim panas',
  'seaside':           'Tepi laut',
  'sunset_rooftop':    'Atap gedung, matahari terbenam',
  'night_sky':         'Langit malam',
  'rain_window':       'Jendela, hujan',
  'clinic':            'Ruang perawatan EVA',
  'hospital_white':    'Ruang putih',
  'black':             'Hitam',
};

export const BGM = {
  'midnight_radio': 'Midnight Radio',
  'little_things':  'Little Things',
  'rain_piano':     'Rain on the Window',
  'warm_town':      'Warm Town',
  'holding_on':     'Holding On',
  'thirteen':       'Thirteen Months',
  'summer_light':   'Summer Light',
  'last_broadcast': 'The Last Broadcast',
  'empty_room':     'Empty Room',
  'new_signal':     'New Signal',
};

export const AMB = {
  'rain_soft': 'Hujan, pelan',
  'rain_heavy': 'Hujan, deras',
  'city_night': 'Kota malam',
  'room_quiet': 'Ruangan sepi',
  'train': 'Kereta',
  'waves': 'Ombak',
  'festival': 'Festival',
  'crowd_cafe': 'Kafe',
};

export const SFX = {
  'radio_on': 'Radio menyala',
  'radio_static': 'Statis radio',
  'radio_switch': 'Tombol siaran',
  'keyboard': 'Ketik',
  'click': 'Klik',
  'beep': 'Beep EVA',
  'notify': 'Notifikasi',
  'door': 'Pintu',
  'train_horn': 'Klakson kereta',
  'fireworks': 'Kembang api',
  'heartbeat': 'Detak jantung',
  'glitch': 'Glitch sistem',
  'shutdown': 'Shutdown',
  'page': 'Balik halaman',
};
