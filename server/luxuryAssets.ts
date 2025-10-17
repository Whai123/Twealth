// Luxury Asset Reference Database
// Accurate pricing and specifications for luxury items

export interface LuxuryVehicle {
  brand: string;
  model: string;
  basePrice: number;
  category: 'supercar' | 'luxury-suv' | 'sports-car' | 'hypercar' | 'luxury-sedan';
  yearlyInsurance?: number;
  yearlyMaintenance?: number;
  depreciationYear1?: number; // percentage
}

export interface LuxuryRealEstate {
  type: string;
  location: string;
  priceRange: { min: number; max: number };
  avgPropertyTax?: number; // percentage
  avgHOA?: number; // monthly
}

export interface LuxuryWatch {
  brand: string;
  model: string;
  price: number;
  appreciates: boolean;
}

// LUXURY VEHICLES DATABASE
export const LUXURY_VEHICLES: LuxuryVehicle[] = [
  // Lamborghini
  { brand: 'Lamborghini', model: 'Huracán EVO', basePrice: 287400, category: 'supercar', yearlyInsurance: 12000, yearlyMaintenance: 8000, depreciationYear1: 20 },
  { brand: 'Lamborghini', model: 'Huracán STO', basePrice: 327838, category: 'supercar', yearlyInsurance: 15000, yearlyMaintenance: 10000, depreciationYear1: 22 },
  { brand: 'Lamborghini', model: 'Aventador SVJ', basePrice: 573966, category: 'hypercar', yearlyInsurance: 25000, yearlyMaintenance: 15000, depreciationYear1: 18 },
  { brand: 'Lamborghini', model: 'Urus', basePrice: 229495, category: 'luxury-suv', yearlyInsurance: 10000, yearlyMaintenance: 7000, depreciationYear1: 25 },
  { brand: 'Lamborghini', model: 'Revuelto', basePrice: 608358, category: 'hypercar', yearlyInsurance: 28000, yearlyMaintenance: 18000, depreciationYear1: 15 },
  
  // Ferrari
  { brand: 'Ferrari', model: 'Roma', basePrice: 243360, category: 'sports-car', yearlyInsurance: 11000, yearlyMaintenance: 9000, depreciationYear1: 20 },
  { brand: 'Ferrari', model: 'F8 Tributo', basePrice: 280000, category: 'supercar', yearlyInsurance: 14000, yearlyMaintenance: 10000, depreciationYear1: 18 },
  { brand: 'Ferrari', model: '296 GTB', basePrice: 321400, category: 'supercar', yearlyInsurance: 16000, yearlyMaintenance: 11000, depreciationYear1: 17 },
  { brand: 'Ferrari', model: 'SF90 Stradale', basePrice: 507300, category: 'hypercar', yearlyInsurance: 22000, yearlyMaintenance: 14000, depreciationYear1: 15 },
  { brand: 'Ferrari', model: 'Purosangue', basePrice: 398350, category: 'luxury-suv', yearlyInsurance: 18000, yearlyMaintenance: 12000, depreciationYear1: 20 },
  
  // McLaren
  { brand: 'McLaren', model: 'GT', basePrice: 210000, category: 'sports-car', yearlyInsurance: 9000, yearlyMaintenance: 8000, depreciationYear1: 22 },
  { brand: 'McLaren', model: '720S', basePrice: 310000, category: 'supercar', yearlyInsurance: 15000, yearlyMaintenance: 12000, depreciationYear1: 25 },
  { brand: 'McLaren', model: '765 LT', basePrice: 382500, category: 'hypercar', yearlyInsurance: 18000, yearlyMaintenance: 14000, depreciationYear1: 20 },
  { brand: 'McLaren', model: 'Artura', basePrice: 237500, category: 'supercar', yearlyInsurance: 12000, yearlyMaintenance: 9000, depreciationYear1: 23 },
  
  // Porsche
  { brand: 'Porsche', model: '911 Turbo S', basePrice: 230400, category: 'sports-car', yearlyInsurance: 8000, yearlyMaintenance: 5000, depreciationYear1: 15 },
  { brand: 'Porsche', model: '911 GT3 RS', basePrice: 241300, category: 'sports-car', yearlyInsurance: 10000, yearlyMaintenance: 6000, depreciationYear1: 10 },
  { brand: 'Porsche', model: 'Taycan Turbo S', basePrice: 185000, category: 'luxury-sedan', yearlyInsurance: 7000, yearlyMaintenance: 3000, depreciationYear1: 30 },
  { brand: 'Porsche', model: 'Cayenne Turbo GT', basePrice: 182150, category: 'luxury-suv', yearlyInsurance: 6000, yearlyMaintenance: 4000, depreciationYear1: 25 },
  
  // Aston Martin
  { brand: 'Aston Martin', model: 'DB12', basePrice: 248000, category: 'sports-car', yearlyInsurance: 11000, yearlyMaintenance: 9000, depreciationYear1: 22 },
  { brand: 'Aston Martin', model: 'DBX707', basePrice: 247000, category: 'luxury-suv', yearlyInsurance: 10000, yearlyMaintenance: 8000, depreciationYear1: 28 },
  { brand: 'Aston Martin', model: 'Vantage', basePrice: 139000, category: 'sports-car', yearlyInsurance: 7000, yearlyMaintenance: 6000, depreciationYear1: 20 },
  
  // Bentley
  { brand: 'Bentley', model: 'Continental GT', basePrice: 236000, category: 'luxury-sedan', yearlyInsurance: 9000, yearlyMaintenance: 7000, depreciationYear1: 25 },
  { brand: 'Bentley', model: 'Bentayga', basePrice: 200000, category: 'luxury-suv', yearlyInsurance: 8000, yearlyMaintenance: 6000, depreciationYear1: 30 },
  { brand: 'Bentley', model: 'Flying Spur', basePrice: 214600, category: 'luxury-sedan', yearlyInsurance: 8500, yearlyMaintenance: 6500, depreciationYear1: 28 },
  
  // Rolls-Royce
  { brand: 'Rolls-Royce', model: 'Ghost', basePrice: 348500, category: 'luxury-sedan', yearlyInsurance: 15000, yearlyMaintenance: 10000, depreciationYear1: 20 },
  { brand: 'Rolls-Royce', model: 'Cullinan', basePrice: 355000, category: 'luxury-suv', yearlyInsurance: 16000, yearlyMaintenance: 11000, depreciationYear1: 22 },
  { brand: 'Rolls-Royce', model: 'Phantom', basePrice: 460000, category: 'luxury-sedan', yearlyInsurance: 20000, yearlyMaintenance: 13000, depreciationYear1: 18 },
];

// LUXURY WATCHES
export const LUXURY_WATCHES: LuxuryWatch[] = [
  { brand: 'Rolex', model: 'Daytona', price: 35000, appreciates: true },
  { brand: 'Rolex', model: 'Submariner', price: 12000, appreciates: true },
  { brand: 'Patek Philippe', model: 'Nautilus 5711', price: 150000, appreciates: true },
  { brand: 'Patek Philippe', model: 'Aquanaut', price: 55000, appreciates: true },
  { brand: 'Audemars Piguet', model: 'Royal Oak', price: 85000, appreciates: true },
  { brand: 'Richard Mille', model: 'RM 011', price: 180000, appreciates: false },
  { brand: 'Omega', model: 'Speedmaster Professional', price: 6500, appreciates: false },
];

// Helper functions
export function findVehicle(searchTerm: string): LuxuryVehicle | null {
  const term = searchTerm.toLowerCase();
  return LUXURY_VEHICLES.find(v => 
    v.model.toLowerCase().includes(term) || 
    v.brand.toLowerCase().includes(term) ||
    `${v.brand} ${v.model}`.toLowerCase().includes(term)
  ) || null;
}

export function getVehiclesByBrand(brand: string): LuxuryVehicle[] {
  return LUXURY_VEHICLES.filter(v => v.brand.toLowerCase() === brand.toLowerCase());
}

export function calculateTotalOwnershipCost(vehicle: LuxuryVehicle, years: number = 5): {
  purchasePrice: number;
  totalInsurance: number;
  totalMaintenance: number;
  totalDepreciation: number;
  totalCost: number;
  remainingValue: number;
} {
  const insurance = (vehicle.yearlyInsurance || 0) * years;
  const maintenance = (vehicle.yearlyMaintenance || 0) * years;
  
  // Calculate depreciation (more aggressive in year 1)
  const year1Depreciation = vehicle.basePrice * ((vehicle.depreciationYear1 || 20) / 100);
  const remainingYears = years - 1;
  const avgYearlyDepreciation = (vehicle.basePrice - year1Depreciation) * 0.10; // 10% per year after year 1
  const totalDepreciation = year1Depreciation + (avgYearlyDepreciation * remainingYears);
  
  const remainingValue = Math.max(0, vehicle.basePrice - totalDepreciation);
  const totalCost = vehicle.basePrice + insurance + maintenance;
  
  return {
    purchasePrice: vehicle.basePrice,
    totalInsurance: insurance,
    totalMaintenance: maintenance,
    totalDepreciation: totalDepreciation,
    totalCost: totalCost,
    remainingValue: remainingValue
  };
}

export function suggestAlternatives(targetPrice: number, category?: string): LuxuryVehicle[] {
  const tolerance = targetPrice * 0.20; // 20% tolerance
  let vehicles = LUXURY_VEHICLES.filter(v => 
    v.basePrice >= targetPrice - tolerance && 
    v.basePrice <= targetPrice + tolerance
  );
  
  if (category) {
    vehicles = vehicles.filter(v => v.category === category);
  }
  
  return vehicles.sort((a, b) => a.basePrice - b.basePrice);
}
