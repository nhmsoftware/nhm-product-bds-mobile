import AsyncStorage from "@react-native-async-storage/async-storage";

import { STORAGE_KEYS } from "@/libs/env";
import { translate } from "@/libs/i18n";
import { getData, type ApiResponse } from "@/libs/api";
import type {
  ListingFilters,
  ListingListResponse,
  PropertyListing
} from "@/services/listings/types";

type BackendProject = {
  id: string;
  name?: string | null;
  type?: string | null;
  location?: string | null;
  image?: string | null;
  price?: string | number | null;
  status?: string | null;
  description?: string | null;
  amenities?: string[] | null;
  legal_info?: string | Record<string, unknown> | null;
  created_at?: string | null;
};

type BackendProjectPage = {
  data?: BackendProject[];
  total?: number;
};

// Temporary local sample data used when backend public project data is unavailable.
const sampleListings: PropertyListing[] = [
  {
    id: "listing-001",
    code: "BDS-HCM-001",
    title: "Căn hộ 2PN view sông tại Thủ Thiêm",
    type: "apartment",
    listingType: "sale",
    status: "available",
    priceVnd: 6850000000,
    areaM2: 78,
    bedrooms: 2,
    bathrooms: 2,
    address: "Đại lộ Mai Chí Thọ",
    ward: "An Khánh",
    district: "TP. Thủ Đức",
    city: "TP. Hồ Chí Minh",
    direction: "Đông Nam",
    legalStatus: "Sổ hồng lâu dài",
    description:
      "Căn hộ hoàn thiện nội thất cơ bản, ban công rộng, phù hợp khách mua ở thật hoặc cho thuê dài hạn.",
    highlights: ["View sông", "Bàn giao nhanh", "Tầng trung", "Gần metro"],
    amenities: ["Hồ bơi", "Gym", "Khu BBQ", "Sảnh đón khách"],
    agent: {
      id: "agent-001",
      name: "Trần Hoàng",
      phone: "0908 111 222",
      agency: "NHM Realty"
    },
    publishedAt: "2026-05-12T03:30:00.000Z",
    viewCount: 482
  },
  {
    id: "listing-002",
    code: "BDS-HN-014",
    title: "Nhà phố 5 tầng gần hồ Tây",
    type: "house",
    listingType: "sale",
    status: "available",
    priceVnd: 14800000000,
    areaM2: 62,
    bedrooms: 4,
    bathrooms: 5,
    address: "Đường Võ Chí Công",
    ward: "Xuân La",
    district: "Tây Hồ",
    city: "Hà Nội",
    direction: "Nam",
    legalStatus: "Sổ đỏ riêng",
    description:
      "Nhà phố mặt ngõ rộng, thiết kế hiện đại, tầng một có thể làm văn phòng nhỏ hoặc studio.",
    highlights: ["Ngõ ô tô", "Gần hồ Tây", "Khai thác cho thuê tốt"],
    amenities: ["Sân thượng", "Gara", "Phòng làm việc"],
    agent: {
      id: "agent-002",
      name: "Lê Phương",
      phone: "0916 222 333",
      agency: "NHM Realty Hà Nội"
    },
    publishedAt: "2026-05-10T09:45:00.000Z",
    viewCount: 305
  },
  {
    id: "listing-003",
    code: "BDS-DN-008",
    title: "Biệt thự nghỉ dưỡng ven biển Đà Nẵng",
    type: "villa",
    listingType: "rent",
    status: "reserved",
    priceVnd: 95000000,
    areaM2: 220,
    bedrooms: 5,
    bathrooms: 6,
    address: "Đường Trường Sa",
    ward: "Hòa Hải",
    district: "Ngũ Hành Sơn",
    city: "Đà Nẵng",
    direction: "Đông",
    legalStatus: "Hợp đồng thuê 12 tháng",
    description:
      "Biệt thự đầy đủ nội thất, sân vườn riêng, thích hợp gia đình chuyên gia hoặc vận hành lưu trú cao cấp.",
    highlights: ["Ven biển", "Hồ bơi riêng", "Nội thất cao cấp"],
    amenities: ["Sân vườn", "Bếp mở", "Dịch vụ quản gia"],
    agent: {
      id: "agent-003",
      name: "Phạm Quốc",
      phone: "0933 555 777",
      agency: "NHM Coastal"
    },
    publishedAt: "2026-05-09T02:15:00.000Z",
    viewCount: 198
  },
  {
    id: "listing-004",
    code: "BDS-HCM-021",
    title: "Shophouse góc khu đô thị mới Bình Chánh",
    type: "townhouse",
    listingType: "sale",
    status: "available",
    priceVnd: 9200000000,
    areaM2: 96,
    bedrooms: 3,
    bathrooms: 4,
    address: "Đường Nguyễn Văn Linh",
    ward: "Bình Hưng",
    district: "Bình Chánh",
    city: "TP. Hồ Chí Minh",
    direction: "Tây Bắc",
    legalStatus: "Hợp đồng mua bán",
    description:
      "Căn góc hai mặt tiền nội khu, phù hợp vừa ở vừa kinh doanh hoặc giữ tài sản trung hạn.",
    highlights: ["Căn góc", "Mặt tiền nội khu", "Dòng tiền tốt"],
    amenities: ["Công viên", "Bãi đỗ xe", "Khu thương mại"],
    agent: {
      id: "agent-001",
      name: "Trần Hoàng",
      phone: "0908 111 222",
      agency: "NHM Realty"
    },
    publishedAt: "2026-05-08T10:00:00.000Z",
    viewCount: 421
  }
];

function createResponse<T>(data: T, message = translate("common.success")): ApiResponse<T> {
  return { message, data };
}

function mapProject(project: BackendProject): PropertyListing {
  const location = project.location || "";
  const [district = location, city = ""] = location.split(",").map((part) => part.trim());
  const priceVnd = Number(project.price ?? 0);

  return {
    id: String(project.id),
    code: String(project.id).slice(0, 8).toUpperCase(),
    title: project.name || "Khu đất đang cập nhật",
    type: project.type === "land" ? "land" : "apartment",
    listingType: "sale",
    status: project.status === "sold_out" ? "sold" : project.status === "reserved" ? "reserved" : "available",
    priceVnd: Number.isFinite(priceVnd) ? priceVnd : 0,
    areaM2: 0,
    bedrooms: 0,
    bathrooms: 0,
    address: location || "Đang cập nhật",
    ward: "",
    district,
    city,
    legalStatus: typeof project.legal_info === "string" ? project.legal_info : "Đang cập nhật",
    description: project.description || "Thông tin khu đất đang được cập nhật.",
    highlights: [],
    amenities: Array.isArray(project.amenities) ? project.amenities : [],
    agent: {
      id: "project-consultant",
      name: "Tư vấn khu đất",
      phone: "Đang cập nhật",
      agency: "Khởi Nguyên Land"
    },
    publishedAt: project.created_at || new Date().toISOString(),
    viewCount: 0
  };
}

async function getBackendProjects(filters?: ListingFilters) {
  const response = await getData<BackendProjectPage>("/api/v1/public/projects", {
    search: filters?.keyword,
    location: filters?.city || filters?.district,
    type: filters?.propertyType,
    min_price: filters?.minPriceVnd,
    max_price: filters?.maxPriceVnd,
    per_page: 20
  });
  const items = Array.isArray(response.data?.data) ? response.data.data.map(mapProject) : [];
  return {
    ...response,
    data: {
      items,
      total: response.data?.total ?? items.length
    }
  };
}

function matchesKeyword(listing: PropertyListing, keyword?: string) {
  if (!keyword?.trim()) {
    return true;
  }

  const normalized = keyword.trim().toLowerCase();
  return [
    listing.title,
    listing.code,
    listing.address,
    listing.ward,
    listing.district,
    listing.city
  ].some((value) => value.toLowerCase().includes(normalized));
}

function filterListings(filters?: ListingFilters) {
  return sampleListings.filter((listing) => {
    if (!matchesKeyword(listing, filters?.keyword)) return false;
    if (filters?.listingType && listing.listingType !== filters.listingType) return false;
    if (filters?.propertyType && listing.type !== filters.propertyType) return false;
    if (filters?.city && listing.city !== filters.city) return false;
    if (filters?.district && listing.district !== filters.district) return false;
    if (filters?.minPriceVnd && listing.priceVnd < filters.minPriceVnd) return false;
    if (filters?.maxPriceVnd && listing.priceVnd > filters.maxPriceVnd) return false;
    return true;
  });
}

async function getSavedIds() {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.savedListings);
  return raw ? (JSON.parse(raw) as string[]) : ["listing-001"];
}

async function setSavedIds(ids: string[]) {
  await AsyncStorage.setItem(STORAGE_KEYS.savedListings, JSON.stringify(ids));
}

export const listingApi = {
  async list(filters?: ListingFilters) {
    try {
      const response = await getBackendProjects(filters);
      if (response.data.items.length > 0) return response;
    } catch {
      // Fall through to local mock data until the backend has seeded public projects.
    }

    const items = filterListings(filters);
    return createResponse<ListingListResponse>({
      items,
      total: items.length
    });
  },

  async getById(id: string) {
    if (!id.startsWith("listing-")) {
      try {
        const response = await getData<BackendProject>(`/api/v1/public/projects/${id}`);
        return {
          ...response,
          data: mapProject(response.data)
        };
      } catch {
        // Fall through to local sample lookup.
      }
    }

    const listing = sampleListings.find((item) => item.id === id);
    if (!listing) {
      throw new Error(translate("errors.listingNotFound"));
    }

    return createResponse<PropertyListing>(listing);
  },

  async getFeatured() {
    try {
      const response = await getBackendProjects();
      if (response.data.items.length > 0) {
        return {
          ...response,
          data: {
            items: response.data.items.slice(0, 3),
            total: Math.min(response.data.total, 3)
          }
        };
      }
    } catch {
      // Fall through to local mock data until backend project data is available.
    }

    return createResponse<ListingListResponse>({
      items: sampleListings.slice(0, 3),
      total: 3
    });
  },

  async getSaved() {
    const savedIds = await getSavedIds();
    const items = sampleListings.filter((item) => savedIds.includes(item.id));
    return createResponse<ListingListResponse>({
      items,
      total: items.length
    });
  },

  async isSaved(id: string) {
    const savedIds = await getSavedIds();
    return savedIds.includes(id);
  },

  async toggleSaved(id: string) {
    const savedIds = await getSavedIds();
    const exists = savedIds.includes(id);
    const nextIds = exists ? savedIds.filter((item) => item !== id) : [...savedIds, id];
    await setSavedIds(nextIds);
    return createResponse<{ saved: boolean }>({ saved: !exists });
  }
};
