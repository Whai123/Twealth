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

export interface LuxuryYacht {
  brand: string;
  model: string;
  length: number; // feet
  basePrice: number;
  yearlyDocking?: number;
  yearlyCrew?: number;
  yearlyFuel?: number;
  yearlyMaintenance?: number;
}

export interface PrivateJet {
  manufacturer: string;
  model: string;
  basePrice: number;
  hourlyOperating: number; // cost per flight hour
  maxRange: number; // nautical miles
  passengers: number;
  yearlyMaintenance?: number;
}

export interface LuxuryJewelry {
  type: string;
  brand?: string;
  priceRange: { min: number; max: number };
  appreciates: boolean;
  description: string;
}

export interface DesignerFashion {
  brand: string;
  category: string;
  priceRange: { min: number; max: number };
  retainsValue: boolean;
  iconic: boolean;
}

export interface LuxuryArt {
  category: string;
  priceRange: { min: number; max: number };
  appreciationRate: number; // percentage per year
  description: string;
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
  { brand: 'Rolex', model: 'GMT-Master II', price: 14000, appreciates: true },
  { brand: 'Rolex', model: 'Sky-Dweller', price: 45000, appreciates: true },
  { brand: 'Patek Philippe', model: 'Nautilus 5711', price: 150000, appreciates: true },
  { brand: 'Patek Philippe', model: 'Aquanaut', price: 55000, appreciates: true },
  { brand: 'Patek Philippe', model: 'Calatrava', price: 35000, appreciates: true },
  { brand: 'Audemars Piguet', model: 'Royal Oak', price: 85000, appreciates: true },
  { brand: 'Audemars Piguet', model: 'Royal Oak Offshore', price: 95000, appreciates: true },
  { brand: 'Richard Mille', model: 'RM 011', price: 180000, appreciates: false },
  { brand: 'Richard Mille', model: 'RM 055', price: 250000, appreciates: false },
  { brand: 'Omega', model: 'Speedmaster Professional', price: 6500, appreciates: false },
  { brand: 'Omega', model: 'Seamaster 300M', price: 5800, appreciates: false },
  { brand: 'Vacheron Constantin', model: 'Overseas', price: 65000, appreciates: true },
  { brand: 'A. Lange & Söhne', model: 'Lange 1', price: 48000, appreciates: true },
];

// LUXURY YACHTS
export const LUXURY_YACHTS: LuxuryYacht[] = [
  { brand: 'Sunseeker', model: 'Predator 65', length: 65, basePrice: 2800000, yearlyDocking: 150000, yearlyCrew: 200000, yearlyFuel: 180000, yearlyMaintenance: 280000 },
  { brand: 'Azimut', model: 'Grande 35 Metri', length: 115, basePrice: 18000000, yearlyDocking: 450000, yearlyCrew: 800000, yearlyFuel: 500000, yearlyMaintenance: 1800000 },
  { brand: 'Ferretti', model: '850', length: 85, basePrice: 8500000, yearlyDocking: 250000, yearlyCrew: 400000, yearlyFuel: 300000, yearlyMaintenance: 850000 },
  { brand: 'Princess', model: 'Y85', length: 85, basePrice: 9200000, yearlyDocking: 260000, yearlyCrew: 420000, yearlyFuel: 320000, yearlyMaintenance: 920000 },
  { brand: 'Benetti', model: 'Delfino 95', length: 95, basePrice: 14500000, yearlyDocking: 380000, yearlyCrew: 650000, yearlyFuel: 450000, yearlyMaintenance: 1450000 },
  { brand: 'Lürssen', model: 'Custom 111m', length: 364, basePrice: 275000000, yearlyDocking: 2500000, yearlyCrew: 5000000, yearlyFuel: 3500000, yearlyMaintenance: 27500000 },
  { brand: 'Feadship', model: 'Custom 78m', length: 256, basePrice: 180000000, yearlyDocking: 1800000, yearlyCrew: 3500000, yearlyFuel: 2500000, yearlyMaintenance: 18000000 },
  { brand: 'Oceanco', model: 'Y719', length: 295, basePrice: 200000000, yearlyDocking: 2000000, yearlyCrew: 4000000, yearlyFuel: 2800000, yearlyMaintenance: 20000000 },
  { brand: 'Heesen', model: 'Project Cosmos', length: 262, basePrice: 150000000, yearlyDocking: 1500000, yearlyCrew: 3000000, yearlyFuel: 2200000, yearlyMaintenance: 15000000 },
  { brand: 'Sanlorenzo', model: 'SX112', length: 112, basePrice: 17500000, yearlyDocking: 420000, yearlyCrew: 750000, yearlyFuel: 480000, yearlyMaintenance: 1750000 },
  { brand: 'Riva', model: '88 Florida', length: 88, basePrice: 7800000, yearlyDocking: 220000, yearlyCrew: 380000, yearlyFuel: 280000, yearlyMaintenance: 780000 },
  { brand: 'Pershing', model: '140', length: 140, basePrice: 22000000, yearlyDocking: 550000, yearlyCrew: 950000, yearlyFuel: 620000, yearlyMaintenance: 2200000 },
];

// PRIVATE JETS
export const PRIVATE_JETS: PrivateJet[] = [
  { manufacturer: 'Gulfstream', model: 'G650ER', basePrice: 70000000, hourlyOperating: 5500, maxRange: 7500, passengers: 19, yearlyMaintenance: 1200000 },
  { manufacturer: 'Gulfstream', model: 'G700', basePrice: 75000000, hourlyOperating: 6000, maxRange: 7500, passengers: 19, yearlyMaintenance: 1300000 },
  { manufacturer: 'Bombardier', model: 'Global 7500', basePrice: 73000000, hourlyOperating: 5800, maxRange: 7700, passengers: 19, yearlyMaintenance: 1250000 },
  { manufacturer: 'Dassault', model: 'Falcon 8X', basePrice: 58000000, hourlyOperating: 4500, maxRange: 6450, passengers: 16, yearlyMaintenance: 950000 },
  { manufacturer: 'Cessna', model: 'Citation Longitude', basePrice: 28000000, hourlyOperating: 3200, maxRange: 3500, passengers: 12, yearlyMaintenance: 580000 },
  { manufacturer: 'Embraer', model: 'Praetor 600', basePrice: 21000000, hourlyOperating: 2800, maxRange: 4018, passengers: 12, yearlyMaintenance: 450000 },
  { manufacturer: 'Bombardier', model: 'Challenger 350', basePrice: 27000000, hourlyOperating: 3100, maxRange: 3200, passengers: 10, yearlyMaintenance: 550000 },
  { manufacturer: 'Cessna', model: 'Citation X+', basePrice: 23000000, hourlyOperating: 2900, maxRange: 3242, passengers: 12, yearlyMaintenance: 480000 },
  { manufacturer: 'Gulfstream', model: 'G280', basePrice: 24500000, hourlyOperating: 2700, maxRange: 3600, passengers: 10, yearlyMaintenance: 500000 },
  { manufacturer: 'HondaJet', model: 'Elite II', basePrice: 7200000, hourlyOperating: 1200, maxRange: 1547, passengers: 6, yearlyMaintenance: 180000 },
  { manufacturer: 'Pilatus', model: 'PC-24', basePrice: 10900000, hourlyOperating: 1800, maxRange: 2000, passengers: 11, yearlyMaintenance: 250000 },
  { manufacturer: 'Dassault', model: 'Falcon 2000LXS', basePrice: 35000000, hourlyOperating: 3500, maxRange: 4000, passengers: 10, yearlyMaintenance: 720000 },
];

// LUXURY REAL ESTATE (Major global markets)
export const LUXURY_REAL_ESTATE: LuxuryRealEstate[] = [
  { type: 'Penthouse', location: 'Manhattan, NYC', priceRange: { min: 15000000, max: 95000000 }, avgPropertyTax: 0.88, avgHOA: 8500 },
  { type: 'Mansion', location: 'Beverly Hills, CA', priceRange: { min: 25000000, max: 150000000 }, avgPropertyTax: 1.2, avgHOA: 5000 },
  { type: 'Oceanfront Villa', location: 'Malibu, CA', priceRange: { min: 20000000, max: 110000000 }, avgPropertyTax: 1.25, avgHOA: 3500 },
  { type: 'Townhouse', location: 'Knightsbridge, London', priceRange: { min: 12000000, max: 75000000 }, avgPropertyTax: 0.5, avgHOA: 6000 },
  { type: 'Penthouse', location: 'Monaco, Monte Carlo', priceRange: { min: 35000000, max: 200000000 }, avgPropertyTax: 0, avgHOA: 12000 },
  { type: 'Villa', location: 'Dubai Palm Jumeirah', priceRange: { min: 8000000, max: 45000000 }, avgPropertyTax: 0, avgHOA: 4500 },
  { type: 'Apartment', location: 'Paris 8th Arr.', priceRange: { min: 10000000, max: 60000000 }, avgPropertyTax: 0.7, avgHOA: 5500 },
  { type: 'Penthouse', location: 'Hong Kong The Peak', priceRange: { min: 40000000, max: 180000000 }, avgPropertyTax: 0, avgHOA: 9000 },
  { type: 'Villa', location: 'Lake Como, Italy', priceRange: { min: 15000000, max: 85000000 }, avgPropertyTax: 0.76, avgHOA: 3000 },
  { type: 'Mansion', location: 'Hamptons, NY', priceRange: { min: 18000000, max: 95000000 }, avgPropertyTax: 2.1, avgHOA: 2500 },
  { type: 'Penthouse', location: 'Miami Beach, FL', priceRange: { min: 12000000, max: 75000000 }, avgPropertyTax: 1.02, avgHOA: 7500 },
  { type: 'Chalet', location: 'Aspen, CO', priceRange: { min: 22000000, max: 120000000 }, avgPropertyTax: 0.55, avgHOA: 4000 },
  { type: 'Villa', location: 'Santorini, Greece', priceRange: { min: 3500000, max: 18000000 }, avgPropertyTax: 0.3, avgHOA: 2000 },
  { type: 'Estate', location: 'Scottsdale, AZ', priceRange: { min: 8000000, max: 45000000 }, avgPropertyTax: 0.72, avgHOA: 3500 },
  { type: 'Penthouse', location: 'Singapore Downtown', priceRange: { min: 25000000, max: 120000000 }, avgPropertyTax: 0, avgHOA: 8000 },
];

// LUXURY JEWELRY
export const LUXURY_JEWELRY: LuxuryJewelry[] = [
  { type: 'Engagement Ring', brand: 'Tiffany & Co.', priceRange: { min: 15000, max: 500000 }, appreciates: false, description: '2-5 carat diamond solitaire' },
  { type: 'Diamond Necklace', brand: 'Cartier', priceRange: { min: 50000, max: 2000000 }, appreciates: true, description: 'Investment-grade diamonds' },
  { type: 'Emerald Ring', brand: 'Harry Winston', priceRange: { min: 75000, max: 1500000 }, appreciates: true, description: 'Colombian emerald with diamonds' },
  { type: 'Sapphire Bracelet', brand: 'Van Cleef & Arpels', priceRange: { min: 40000, max: 800000 }, appreciates: true, description: 'Ceylon sapphires' },
  { type: 'Ruby Earrings', brand: 'Bulgari', priceRange: { min: 35000, max: 600000 }, appreciates: true, description: 'Burmese rubies' },
  { type: 'Diamond Bracelet', brand: 'Graff', priceRange: { min: 120000, max: 5000000 }, appreciates: true, description: 'D-color flawless diamonds' },
  { type: 'Pearl Necklace', brand: 'Mikimoto', priceRange: { min: 8000, max: 150000 }, appreciates: false, description: 'South Sea pearls' },
  { type: 'Gold Watch', brand: 'Chopard', priceRange: { min: 25000, max: 300000 }, appreciates: false, description: 'Diamond-set luxury watch' },
  { type: 'Tanzanite Ring', priceRange: { min: 12000, max: 180000 }, appreciates: true, description: 'Rare tanzanite gemstone' },
  { type: 'Pink Diamond Ring', brand: 'De Beers', priceRange: { min: 250000, max: 10000000 }, appreciates: true, description: 'Investment-grade pink diamond' },
];

// DESIGNER FASHION
export const DESIGNER_FASHION: DesignerFashion[] = [
  { brand: 'Hermès', category: 'Birkin Bag', priceRange: { min: 12000, max: 500000 }, retainsValue: true, iconic: true },
  { brand: 'Hermès', category: 'Kelly Bag', priceRange: { min: 10000, max: 400000 }, retainsValue: true, iconic: true },
  { brand: 'Chanel', category: 'Classic Flap Bag', priceRange: { min: 9000, max: 45000 }, retainsValue: true, iconic: true },
  { brand: 'Louis Vuitton', category: 'Monogram Canvas Bag', priceRange: { min: 1500, max: 8000 }, retainsValue: false, iconic: true },
  { brand: 'Dior', category: 'Lady Dior Bag', priceRange: { min: 5000, max: 25000 }, retainsValue: false, iconic: true },
  { brand: 'Gucci', category: 'Jackie 1961 Bag', priceRange: { min: 3500, max: 15000 }, retainsValue: false, iconic: true },
  { brand: 'Bottega Veneta', category: 'Intrecciato Bag', priceRange: { min: 3000, max: 18000 }, retainsValue: false, iconic: false },
  { brand: 'Christian Louboutin', category: 'Heels', priceRange: { min: 700, max: 6000 }, retainsValue: false, iconic: true },
  { brand: 'Manolo Blahnik', category: 'Hangisi Pumps', priceRange: { min: 1000, max: 5000 }, retainsValue: false, iconic: true },
  { brand: 'Burberry', category: 'Trench Coat', priceRange: { min: 2000, max: 8000 }, retainsValue: false, iconic: true },
  { brand: 'Tom Ford', category: 'Suit', priceRange: { min: 5000, max: 20000 }, retainsValue: false, iconic: false },
  { brand: 'Loro Piana', category: 'Cashmere Coat', priceRange: { min: 6000, max: 25000 }, retainsValue: false, iconic: false },
];

// LUXURY ART & COLLECTIBLES
export const LUXURY_ART: LuxuryArt[] = [
  { category: 'Contemporary Art (Blue-chip)', priceRange: { min: 100000, max: 50000000 }, appreciationRate: 8.5, description: 'Works by Banksy, Kaws, Basquiat' },
  { category: 'Impressionist Paintings', priceRange: { min: 500000, max: 100000000 }, appreciationRate: 6.2, description: 'Monet, Renoir, Degas' },
  { category: 'Modern Art', priceRange: { min: 250000, max: 75000000 }, appreciationRate: 7.1, description: 'Picasso, Warhol, Rothko' },
  { category: 'Photography (Fine Art)', priceRange: { min: 15000, max: 5000000 }, appreciationRate: 5.8, description: 'Limited editions by masters' },
  { category: 'Sculpture (Bronze)', priceRange: { min: 50000, max: 15000000 }, appreciationRate: 6.5, description: 'Rodin, Moore, Giacometti' },
  { category: 'Rare Wine Collection', priceRange: { min: 10000, max: 2000000 }, appreciationRate: 9.2, description: 'Bordeaux, Burgundy investment bottles' },
  { category: 'Classic Cars (Investment)', priceRange: { min: 500000, max: 70000000 }, appreciationRate: 12.5, description: 'Ferrari 250 GTO, vintage Porsches' },
  { category: 'Rare Whisky', priceRange: { min: 5000, max: 500000 }, appreciationRate: 15.0, description: 'Macallan, Dalmore rare casks' },
  { category: 'Vintage Hermès Bags', priceRange: { min: 15000, max: 500000 }, appreciationRate: 11.3, description: 'Birkin, Kelly investment pieces' },
  { category: 'First Edition Books', priceRange: { min: 8000, max: 1000000 }, appreciationRate: 7.8, description: 'Shakespeare, Darwin, rare manuscripts' },
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

// Yacht helper functions
export function findYacht(searchTerm: string): LuxuryYacht | null {
  const term = searchTerm.toLowerCase();
  return LUXURY_YACHTS.find(y => 
    y.model.toLowerCase().includes(term) || 
    y.brand.toLowerCase().includes(term) ||
    `${y.brand} ${y.model}`.toLowerCase().includes(term)
  ) || null;
}

export function calculateYachtOwnershipCost(yacht: LuxuryYacht, years: number = 5): {
  purchasePrice: number;
  totalDocking: number;
  totalCrew: number;
  totalFuel: number;
  totalMaintenance: number;
  totalCost: number;
  annualRunningCost: number;
} {
  const docking = (yacht.yearlyDocking || 0) * years;
  const crew = (yacht.yearlyCrew || 0) * years;
  const fuel = (yacht.yearlyFuel || 0) * years;
  const maintenance = (yacht.yearlyMaintenance || 0) * years;
  const annualRunningCost = (yacht.yearlyDocking || 0) + (yacht.yearlyCrew || 0) + (yacht.yearlyFuel || 0) + (yacht.yearlyMaintenance || 0);
  
  return {
    purchasePrice: yacht.basePrice,
    totalDocking: docking,
    totalCrew: crew,
    totalFuel: fuel,
    totalMaintenance: maintenance,
    totalCost: yacht.basePrice + docking + crew + fuel + maintenance,
    annualRunningCost: annualRunningCost
  };
}

// Private jet helper functions
export function findJet(searchTerm: string): PrivateJet | null {
  const term = searchTerm.toLowerCase();
  return PRIVATE_JETS.find(j => 
    j.model.toLowerCase().includes(term) || 
    j.manufacturer.toLowerCase().includes(term) ||
    `${j.manufacturer} ${j.model}`.toLowerCase().includes(term)
  ) || null;
}

export function calculateJetOwnershipCost(jet: PrivateJet, hoursPerYear: number = 200, years: number = 5): {
  purchasePrice: number;
  totalOperating: number;
  totalMaintenance: number;
  totalCost: number;
  costPerHour: number;
} {
  const operating = jet.hourlyOperating * hoursPerYear * years;
  const maintenance = (jet.yearlyMaintenance || 0) * years;
  
  return {
    purchasePrice: jet.basePrice,
    totalOperating: operating,
    totalMaintenance: maintenance,
    totalCost: jet.basePrice + operating + maintenance,
    costPerHour: (jet.basePrice + operating + maintenance) / (hoursPerYear * years)
  };
}

// Real estate helper functions
export function findRealEstate(location: string): LuxuryRealEstate[] {
  const term = location.toLowerCase();
  return LUXURY_REAL_ESTATE.filter(r => 
    r.location.toLowerCase().includes(term)
  );
}

export function calculateRealEstateOwnershipCost(property: LuxuryRealEstate, purchasePrice: number, years: number = 5): {
  purchasePrice: number;
  totalPropertyTax: number;
  totalHOA: number;
  totalCost: number;
  annualCost: number;
} {
  const propertyTax = purchasePrice * ((property.avgPropertyTax || 0) / 100) * years;
  const hoa = (property.avgHOA || 0) * 12 * years;
  const annualCost = (purchasePrice * ((property.avgPropertyTax || 0) / 100)) + ((property.avgHOA || 0) * 12);
  
  return {
    purchasePrice: purchasePrice,
    totalPropertyTax: propertyTax,
    totalHOA: hoa,
    totalCost: purchasePrice + propertyTax + hoa,
    annualCost: annualCost
  };
}

// Jewelry helper functions
export function findJewelry(type: string): LuxuryJewelry[] {
  const term = type.toLowerCase();
  return LUXURY_JEWELRY.filter(j => 
    j.type.toLowerCase().includes(term) ||
    (j.brand && j.brand.toLowerCase().includes(term))
  );
}

// Fashion helper functions
export function findFashion(brand: string): DesignerFashion[] {
  const term = brand.toLowerCase();
  return DESIGNER_FASHION.filter(f => 
    f.brand.toLowerCase().includes(term) ||
    f.category.toLowerCase().includes(term)
  );
}

// Art helper functions
export function findArt(category: string): LuxuryArt[] {
  const term = category.toLowerCase();
  return LUXURY_ART.filter(a => 
    a.category.toLowerCase().includes(term)
  );
}

export function calculateArtAppreciation(art: LuxuryArt, purchasePrice: number, years: number = 10): {
  purchasePrice: number;
  appreciationRate: number;
  projectedValue: number;
  totalGain: number;
  annualGain: number;
} {
  const projectedValue = purchasePrice * Math.pow(1 + (art.appreciationRate / 100), years);
  const totalGain = projectedValue - purchasePrice;
  const annualGain = totalGain / years;
  
  return {
    purchasePrice: purchasePrice,
    appreciationRate: art.appreciationRate,
    projectedValue: projectedValue,
    totalGain: totalGain,
    annualGain: annualGain
  };
}
