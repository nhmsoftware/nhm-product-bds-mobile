export type ListingType = "sale" | "rent";

export type PropertyType =
  | "apartment"
  | "house"
  | "villa"
  | "townhouse"
  | "land"
  | "office";

export type ListingStatus = "available" | "reserved" | "sold";

export type ListingAgent = {
  id: string;
  name: string;
  phone: string;
  agency: string;
};

export type PropertyListing = {
  id: string;
  code: string;
  title: string;
  type: PropertyType;
  listingType: ListingType;
  status: ListingStatus;
  priceVnd: number;
  areaM2: number;
  bedrooms: number;
  bathrooms: number;
  address: string;
  ward: string;
  district: string;
  city: string;
  direction?: string;
  legalStatus: string;
  description: string;
  highlights: string[];
  amenities: string[];
  agent: ListingAgent;
  publishedAt: string;
  viewCount: number;
};

export type ListingFilters = {
  keyword?: string;
  listingType?: ListingType;
  propertyType?: PropertyType;
  city?: string;
  district?: string;
  minPriceVnd?: number;
  maxPriceVnd?: number;
};

export type ListingListResponse = {
  items: PropertyListing[];
  total: number;
};
