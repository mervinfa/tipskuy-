import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Skrip sekali jalan: membaca data/regions-source.json (dataset Kemendagri relasi BPS,
// repo zakiego/Kode-Wilayah-Administrasi-Indonesia-Relasi-BPS-Kemendagri) dan menulis:
// - public/regions/provinces.json + public/regions/{kodeProvinsi}.json (untuk client)
// - data/regions.json (indeks gabungan untuk server, dibaca lewat import JSON)
// Koordinat kota dari daftar kurasi; kota lain memakai fallback titik pusat provinsi
// (sesuai opsi fallback TDD 6.2, geocoding Nominatim tidak dijalankan).

type ProvinceRow = {
  kode_dagri: number;
  nama_dagri: string;
};

type CityRow = {
  kode_dagri: string;
  nama_dagri: string;
};

type Point = { code: string; name: string; lat: number; lng: number };

type CityPoint = Point & { provinceCode: string };

const PROVINCE_COORDS: Record<string, [number, number]> = {
  "11": [5.55, 95.32],
  "12": [3.59, 98.67],
  "13": [-0.95, 100.35],
  "14": [0.51, 101.44],
  "15": [-1.61, 103.61],
  "16": [-2.98, 104.75],
  "17": [-3.8, 102.27],
  "18": [-5.39, 105.27],
  "19": [-2.13, 106.45],
  "21": [0.92, 104.45],
  "31": [-6.186, 106.833],
  "32": [-6.9175, 107.6191],
  "33": [-6.9667, 110.4167],
  "34": [-7.797, 110.37],
  "35": [-7.2575, 112.7521],
  "36": [-6.12, 106.15],
  "51": [-8.65, 115.22],
  "52": [-8.58, 116.11],
  "53": [-10.18, 123.6],
  "61": [-0.03, 109.33],
  "62": [-2.21, 113.92],
  "63": [-3.32, 114.59],
  "64": [-0.5, 117.15],
  "65": [2.83, 117.42],
  "71": [1.48, 124.85],
  "72": [-0.9, 119.87],
  "73": [-5.15, 119.43],
  "74": [-3.99, 122.51],
  "75": [0.54, 123.06],
  "76": [-2.68, 118.89],
  "81": [-3.65, 128.19],
  "82": [0.7, 127.55],
  "91": [-2.53, 140.72],
  "92": [-0.86, 134.06],
};

// Kota dengan koordinat terkurasi (pusat pemerintahan atau pusat kota).
const CITY_COORDS: Record<string, [number, number]> = {
  "KOTA BANDA ACEH": [5.55, 95.32],
  "KOTA MEDAN": [3.59, 98.67],
  "KOTA PADANG": [-0.95, 100.35],
  "KOTA PEKANBARU": [0.51, 101.44],
  "KOTA JAMBI": [-1.61, 103.61],
  "KOTA PALEMBANG": [-2.98, 104.75],
  "KOTA BENGKULU": [-3.8, 102.27],
  "KOTA BANDAR LAMPUNG": [-5.39, 105.27],
  "KOTA PANGKAL PINANG": [-2.13, 106.45],
  "KOTA BATAM": [1.13, 104.05],
  "KOTA TANJUNG PINANG": [0.92, 104.45],
  "KOTA ADM. JAKARTA PUSAT": [-6.186, 106.833],
  "KOTA ADM. JAKARTA BARAT": [-6.16, 106.77],
  "KOTA ADM. JAKARTA SELATAN": [-6.29, 106.81],
  "KOTA ADM. JAKARTA TIMUR": [-6.23, 106.89],
  "KOTA ADM. JAKARTA UTARA": [-6.12, 106.84],
  "KOTA BANDUNG": [-6.9175, 107.6191],
  "KOTA SEMARANG": [-6.9667, 110.4167],
  "KOTA YOGYAKARTA": [-7.797, 110.37],
  "KOTA SURABAYA": [-7.2575, 112.7521],
  "KOTA SERANG": [-6.12, 106.15],
  "KOTA DENPASAR": [-8.65, 115.22],
  "KOTA MATARAM": [-8.58, 116.11],
  "KOTA KUPANG": [-10.18, 123.6],
  "KOTA PONTIANAK": [-0.03, 109.33],
  "KOTA PALANGKARAYA": [-2.21, 113.92],
  "KOTA BANJARMASIN": [-3.32, 114.59],
  "KOTA SAMARINDA": [-0.5, 117.15],
  "KOTA TARAKAN": [3.31, 117.59],
  "KAB. BULUNGAN": [2.83, 117.42],
  "KOTA MANADO": [1.48, 124.85],
  "KOTA PALU": [-0.9, 119.87],
  "KOTA MAKASSAR": [-5.15, 119.43],
  "KOTA KENDARI": [-3.99, 122.51],
  "KOTA GORONTALO": [0.54, 123.06],
  "KAB. MAMUJU": [-2.68, 118.89],
  "KOTA AMBON": [-3.65, 128.19],
  "KOTA TERNATE": [0.79, 127.38],
  "KAB. HALMAHERA TENGAH": [0.7, 127.55],
  "KOTA JAYAPURA": [-2.53, 140.72],
  "KAB. MANOKWARI": [-0.86, 134.06],
  "KOTA SURAKARTA": [-7.57, 110.83],
  "KOTA MALANG": [-7.98, 112.63],
  "KOTA BEKASI": [-6.23, 106.99],
  "KOTA DEPOK": [-6.4, 106.82],
  "KOTA TANGERANG": [-6.17, 106.66],
  "KOTA TANGERANG SELATAN": [-6.29, 106.71],
  "KOTA BOGOR": [-6.6, 106.8],
  "KOTA CIMAHI": [-6.87, 107.54],
};

const KEEP_UPPER = new Set(["DKI", "DI"]);

function titleCase(name: string): string {
  return name
    .split(" ")
    .map((word) =>
      KEEP_UPPER.has(word)
        ? word
        : word
            .split("-")
            .map((part) => (part.length <= 1 ? part : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()))
            .join("-")
    )
    .join(" ");
}

async function main() {
  const raw = await readFile(path.join(process.cwd(), "data", "regions-source.json"), "utf8");
  const source = JSON.parse(raw) as { provinsi: ProvinceRow[]; kabkota: CityRow[] };

  if (source.provinsi.length !== 34) {
    throw new Error(`Jumlah provinsi tidak 34: ${source.provinsi.length}`);
  }

  const provinces: Point[] = [];
  const provinceNames = new Map<string, string>();
  for (const row of source.provinsi) {
    const code = String(row.kode_dagri);
    const coords = PROVINCE_COORDS[code];
    if (!coords) {
      throw new Error(`Koordinat provinsi ${code} belum dikurasi`);
    }
    provinces.push({ code, name: titleCase(row.nama_dagri), lat: coords[0], lng: coords[1] });
    provinceNames.set(code, titleCase(row.nama_dagri));
  }

  const cities: CityPoint[] = [];
  const seenCityCodes = new Set<string>();
  const cityNames = new Set(source.kabkota.map((row) => row.nama_dagri));
  const matchedCurated = new Set<string>();
  for (const row of source.kabkota) {
    const code = row.kode_dagri;
    if (!/^\d{4}$/.test(code)) {
      throw new Error(`Kode kota tidak 4 digit: ${code} ${row.nama_dagri}`);
    }
    if (seenCityCodes.has(code)) {
      throw new Error(`Kode kota duplikat: ${code} ${row.nama_dagri}`);
    }
    seenCityCodes.add(code);
    const provinceCode = code.slice(0, 2);
    const provinceCoords = PROVINCE_COORDS[provinceCode];
    if (!provinceCoords || !provinceNames.has(provinceCode)) {
      throw new Error(`Kota ${code} tidak punya provinsi valid`);
    }
    const curated = CITY_COORDS[row.nama_dagri];
    if (curated) {
      matchedCurated.add(row.nama_dagri);
    }
    const coords = curated ?? provinceCoords;
    cities.push({ code, name: titleCase(row.nama_dagri), provinceCode, lat: coords[0], lng: coords[1] });
  }

  const unmatched = Object.keys(CITY_COORDS).filter((name) => !cityNames.has(name));
  if (unmatched.length > 0) {
    throw new Error(`Nama kota kurasi tidak ada di dataset: ${unmatched.join(", ")}`);
  }

  const regionsDir = path.join(process.cwd(), "public", "regions");
  await mkdir(regionsDir, { recursive: true });
  await writeFile(path.join(regionsDir, "provinces.json"), JSON.stringify(provinces), "utf8");

  const byProvince = new Map<string, Point[]>();
  for (const city of cities) {
    const bucket = byProvince.get(city.provinceCode) ?? [];
    bucket.push({ code: city.code, name: city.name, lat: city.lat, lng: city.lng });
    byProvince.set(city.provinceCode, bucket);
  }
  for (const [provinceCode, provinceCities] of byProvince) {
    await writeFile(path.join(regionsDir, `${provinceCode}.json`), JSON.stringify(provinceCities), "utf8");
  }

  const dataDir = path.join(process.cwd(), "data");
  await mkdir(dataDir, { recursive: true });
  await writeFile(
    path.join(dataDir, "regions.json"),
    JSON.stringify({ provinces, cities }),
    "utf8"
  );

  console.info(
    `Region selesai: ${provinces.length} provinsi, ${cities.length} kota, ` +
      `${matchedCurated.size} kota dengan koordinat kurasi, sisanya fallback pusat provinsi.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
