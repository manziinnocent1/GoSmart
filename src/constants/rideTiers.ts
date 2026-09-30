export type RideTierId = 'moto' | 'car' | 'xl';

export interface RideTier {
  id: RideTierId;
  name: string;
  etaMinutes: number;
  priceRwf: number;
  note: string;
}

export const RIDE_TIERS: readonly RideTier[] = [
  { id: 'moto', name: 'Moto', etaMinutes: 3, priceRwf: 800, note: 'Fastest through traffic' },
  { id: 'car', name: 'Car', etaMinutes: 6, priceRwf: 2500, note: 'Up to 3 riders' },
  { id: 'xl', name: 'XL', etaMinutes: 9, priceRwf: 4200, note: 'Up to 6 riders' },
];

export const SAVED_PLACES = ['Home', 'Work', 'BK Arena', 'Airport'] as const;