import regionsData from "@/data/regions.json";

export type RegionProvince = { code: string; name: string; lat: number; lng: number };

export type RegionCity = {
  code: string;
  name: string;
  provinceCode: string;
  lat: number;
  lng: number;
};

export type CityRef = {
  provinceCode: string;
  province: string;
  cityCode: string;
  city: string;
  lat: number;
  lng: number;
};

const provinces: RegionProvince[] = regionsData.provinces;
const cities: RegionCity[] = regionsData.cities;

const cityByCode = new Map<string, RegionCity>(cities.map((city) => [city.code, city]));

const citiesByProvince = new Map<string, RegionCity[]>();
for (const city of cities) {
  const bucket = citiesByProvince.get(city.provinceCode) ?? [];
  bucket.push(city);
  citiesByProvince.set(city.provinceCode, bucket);
}

const provinceByCode = new Map<string, RegionProvince>(provinces.map((province) => [province.code, province]));

export function getProvinces(): RegionProvince[] {
  return provinces;
}

export function getCitiesByProvince(provinceCode: string): RegionCity[] {
  return citiesByProvince.get(provinceCode) ?? [];
}

// Validasi server untuk cityCode (TDD 6.2: client tidak dipercaya untuk data wilayah).
export function findCity(cityCode: string): CityRef | null {
  const city = cityByCode.get(cityCode);
  if (!city) return null;
  const province = provinceByCode.get(city.provinceCode);
  if (!province) return null;
  return {
    provinceCode: city.provinceCode,
    province: province.name,
    cityCode: city.code,
    city: city.name,
    lat: city.lat,
    lng: city.lng,
  };
}
