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

async function getSavedIds() {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.savedListings);
  return raw ? (JSON.parse(raw) as string[]) : [];
}

async function setSavedIds(ids: string[]) {
  await AsyncStorage.setItem(STORAGE_KEYS.savedListings, JSON.stringify(ids));
}

export const listingApi = {
  async list(filters?: ListingFilters) {
    const response = await getBackendProjects(filters);
    return response;
  },

  async getById(id: string) {
    const response = await getData<BackendProject>(`/api/v1/public/projects/${id}`);
    return {
      ...response,
      data: mapProject(response.data)
    };
  },

  async getFeatured() {
    const response = await getBackendProjects();
    return {
      ...response,
      data: {
        items: response.data.items.slice(0, 3),
        total: Math.min(response.data.total, 3)
      }
    };
  },

  async getSaved() {
    const savedIds = await getSavedIds();
    if (savedIds.length === 0) {
      return createResponse<ListingListResponse>({
        items: [],
        total: 0
      });
    }

    const items: PropertyListing[] = [];
    for (const savedId of savedIds) {
      try {
        const response = await getData<BackendProject>(`/api/v1/public/projects/${savedId}`);
        items.push(mapProject(response.data));
      } catch {
        // Skip listings that no longer exist on the backend.
      }
    }

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
