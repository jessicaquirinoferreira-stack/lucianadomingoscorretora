export type PropertyType =
  | 'Apartamento'
  | 'Casa'
  | 'Sobrado'
  | 'Cobertura'
  | 'Studio'
  | 'Terreno'
  | 'Comercial';

export type PropertyPurpose = 'Venda' | 'Locação';
export type PropertyStatus = 'Disponível' | 'Reservado' | 'Vendido';
export type OccupancyType = 'Exclusivo' | 'Compartilhado' | 'Ambos';

export interface Property {
  id: string;
  title: string;
  slug?: string;
  description: string;
  propertyType: PropertyType;
  purpose: PropertyPurpose;
  status: PropertyStatus;
  price: number;
  condoFee?: number;
  iptu?: number;
  areaSqm: number;
  bedrooms: number;
  suites: number;
  bathrooms: number;
  parkingSpaces: number;
  city: string;
  neighborhood: string;
  address?: string;
  nearUniversity: boolean;
  universityDistance?: string;
  occupancyType: OccupancyType;
  idealForPeople: string;
  lifestyleTags: string[];
  features: string[];
  images: string[];
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DevelopmentStage = 'Lançamento' | 'Em Obras' | 'Pronto para Morar';

export interface DevelopmentTypology {
  name: string;
  areaSqm: string;
  bedrooms: string;
  parking: string;
  priceFrom: number;
}

export interface Development {
  id: string;
  name: string;
  slug: string;
  developer: string;
  tagline: string;
  description: string;
  stage: DevelopmentStage;
  deliveryDate: string;
  city: string;
  neighborhood: string;
  address: string;
  startingPrice: number;
  heroImage: string;
  galleryImages: string[];
  floorPlanImages: string[];
  typologies: DevelopmentTypology[];
  amenities: string[];
  differentials: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LandingPageDifferential {
  title: string;
  description: string;
}

export interface LandingPageReason {
  title: string;
  description: string;
}

export interface LandingPage {
  id: string;
  developmentId: string;
  slug: string;
  status: 'draft' | 'published';
  heroTitle: string;
  heroSlogan: string;
  heroSubtitle: string;
  heroImage: string;
  ctaPrimaryText: string;
  differentials: LandingPageDifferential[];
  galleryImages: string[];
  floorPlanImages: string[];
  typologies: DevelopmentTypology[];
  locationSummary: string;
  nearbyHighlights: string[];
  mapQuery: string;
  leisureHighlights: string[];
  whyInvestTitle: string;
  whyInvestReasons: LandingPageReason[];
  trustQuote: string;
  trustAuthor: string;
  seoTitle: string;
  seoDescription: string;
  createdAt: string;
  updatedAt: string;
}

export type LeadSource = 'contato' | 'imovel' | 'busca_inteligente' | 'landing_page';
export type LeadStatus = 'Novo' | 'Em Atendimento' | 'Agendado' | 'Convertido';

export interface Lead {
  id: string;
  name: string;
  whatsapp: string;
  email?: string;
  message?: string;
  source: LeadSource;
  referenceId?: string;
  referenceTitle?: string;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Testimonial {
  id: string;
  clientName: string;
  clientRole: string;
  city: string;
  quote: string;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SiteSettings {
  id: string;
  brokerName: string;
  creci: string;
  slogan: string;
  heroHeadline: string;
  heroSubheadline: string;
  whatsappNumber: string;
  instagramHandle: string;
  contactEmail: string;
  officeAddress: string;
  updatedAt: string;
}

export interface SmartSearchAnswers {
  freeText: string;
  peopleCount: string;
  studentOrUniversity: string;
  occupancyPreference: string;
  lifestyle: string;
  region: string;
  budgetRange: string;
}

export interface SmartSearchRecommendation {
  propertyId: string;
  matchScore: number;
  reason: string;
}

export interface SmartSearchResponse {
  headline: string;
  summary: string;
  recommendations: SmartSearchRecommendation[];
}

export interface CatalogFilterPreset {
  purpose?: string;
  city?: string;
  propertyType?: string;
  onlyNearUni?: boolean;
  onlySaved?: boolean;
}

