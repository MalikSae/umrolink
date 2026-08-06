export type DummyType = {
  id: string;
};

import { kabupatenKotaData } from './data/kabupaten-kota.js';

export type CityData = {
  id: string;
  name: string;
  province: string;
};

export const kabupatenKota: CityData[] = kabupatenKotaData;

