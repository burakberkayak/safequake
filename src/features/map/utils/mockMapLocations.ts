export interface MapLocation {
  id: string;
  type: 'shelter' | 'hospital_state' | 'hospital_private' | 'pharmacy';
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
}

const ISTANBUL_COORDS = { latitude: 41.0082, longitude: 28.9784 };

export const generateMapLocations = (lat: number = ISTANBUL_COORDS.latitude, lon: number = ISTANBUL_COORDS.longitude): MapLocation[] => {
  // Generate locations around the center coordinate within ~2km
  return [
    // Toplanma Alanları (Shelters)
    {
      id: 's1',
      type: 'shelter',
      name: 'Atatürk Parkı Afet Toplanma Alanı',
      address: 'Merkez Mahallesi, Atatürk Caddesi, Park İçi Yolu',
      latitude: lat + 0.005,
      longitude: lon + 0.004,
    },
    {
      id: 's2',
      type: 'shelter',
      name: 'Deprem Parkı Toplanma Alanı',
      address: 'Yeni Mahalle, 402. Sokak No:12',
      latitude: lat - 0.008,
      longitude: lon - 0.006,
    },
    {
      id: 's3',
      type: 'shelter',
      name: 'Cumhuriyet Meydanı Geniş Güvenli Alan',
      address: 'Cumhuriyet Caddesi, Kent Meydanı Açık Alanı',
      latitude: lat + 0.002,
      longitude: lon - 0.009,
    },

    // Hastaneler (Hospitals)
    {
      id: 'h1',
      type: 'hospital_state',
      name: 'Devlet Hastanesi Acil Servisi',
      address: 'Hastane Yolu Caddesi No:45',
      latitude: lat + 0.012,
      longitude: lon + 0.010,
      phone: '02125555555',
    },
    {
      id: 'h2',
      type: 'hospital_private',
      name: 'Özel Avrasya Tıp Merkezi',
      address: 'Hürriyet Mahallesi, Vatan Caddesi No:102',
      latitude: lat - 0.003,
      longitude: lon + 0.015,
      phone: '02124444444',
    },

    // Eczaneler (Pharmacies)
    {
      id: 'p1',
      type: 'pharmacy',
      name: 'Hayat Nöbetçi Eczanesi',
      address: 'Şifa Sokak No:3/A (Hastanenin Karşısı)',
      latitude: lat + 0.011,
      longitude: lon + 0.012,
      phone: '02123333333',
    },
    {
      id: 'p2',
      type: 'pharmacy',
      name: 'Güven Eczanesi',
      address: 'Atatürk Caddesi No:18/C',
      latitude: lat - 0.006,
      longitude: lon + 0.002,
      phone: '02122222222',
    },
  ];
};
