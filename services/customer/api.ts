import { getData, postData } from "@/libs/api";

export type NewsLikeData = {
  is_liked?: boolean;
  liked?: boolean;
  likes_count?: number;
};

export type PaginatedData<T> = {
  data?: T[];
  list?: T[];
  current_page?: number;
  last_page?: number;
  total?: number;
  pagination?: {
    total?: number;
    per_page?: number;
    current_page?: number;
    last_page?: number;
  };
};

export type PublicProject = {
  id: string;
  name?: string | null;
  location?: string | null;
  image?: string | null;
  banner?: string | string[] | null;
  price?: string | number | null;
  status?: string | number | null;
  type?: string | null;
  description?: string | null;
  amenities?: unknown;
  floor_plans?: unknown;
  legal_info?: unknown;
  brochure?: string | null;
  contact_info?: unknown;
  google_maps_url?: string | null;
  location_image?: string | null;
  planning_info?: unknown;
  branch?: string | null;
  total_lots?: number | null;
  remaining_lots?: number | null;
  is_featured?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type PublicPlanning = {
  id: string;
  title?: string | null;
  map_image?: string | null;
  status?: string | number | null;
  updated_year?: number | string | null;
  description?: string | null;
  city?: string | null;
  district?: string | null;
  sub_area?: string | null;
  symbol?: string | null;
  density?: string | null;
  max_height?: string | null;
  land_use_ratio?: string | null;
  setback?: string | null;
  land_type_notes?: string | null;
  pdf_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  content?: string | null;
  updated_at?: string | null;
};

export type PublicNews = {
  id: string;
  title?: string | null;
  slug?: string | null;
  summary?: string | null;
  content?: string | null;
  content_blocks?: NewsContentBlock[] | null;
  contentBlocks?: NewsContentBlock[] | null;
  thumbnail?: string | null;
  category?: string | null;
  attachments?: NewsAttachment[] | null;
  tags?: string[] | string | null;
  quote?: NewsQuote | null;
  likes_count?: number | null;
  is_liked?: boolean | null;
  liked?: boolean | null;
  published_at?: string | null;
};

export type NewsContentBlock = {
  type?: "heading" | "paragraph" | "image" | "quote" | string | null;
  text?: string | null;
  url?: string | null;
  caption?: string | null;
  author?: string | null;
};

export type NewsAttachment = {
  name?: string | null;
  url?: string | null;
  mime_type?: string | null;
  size?: number | null;
};

export type NewsQuote = {
  text?: string | null;
  author?: string | null;
};

export function publicNewsDetailParams(news: PublicNews) {
  const id = news.slug || news.id;

  return {
    id,
    ...(typeof news.likes_count === "number" ? { likes_count: String(news.likes_count) } : {}),
    ...(typeof news.is_liked === "boolean" ? { is_liked: String(news.is_liked) } : {}),
    ...(typeof news.liked === "boolean" ? { liked: String(news.liked) } : {})
  };
}

export type NewsListData = {
  featured?: PublicNews[];
  list?: PublicNews[];
  pagination?: PaginatedData<PublicNews>["pagination"];
  categories?: unknown[];
};

export type NewsDetailData = {
  detail?: PublicNews;
  related?: PublicNews[];
};

export type LegalVideo = {
  id: string;
  title?: string | null;
  slug?: string | null;
  category?: string | null;
  short_description?: string | null;
  description?: string | null;
  thumbnail?: string | null;
  thumbnail_url?: string | null;
  duration?: string | number | null;
  duration_seconds?: string | number | null;
  video_url?: string | null;
  created_at?: string | null;
  published_at?: string | null;
};

export type LegalVideoListData = {
  list?: LegalVideo[];
  pagination?: PaginatedData<LegalVideo>["pagination"];
  categories?: unknown[];
};

export type LegalVideoDetailData = {
  detail?: LegalVideo;
};

export type ConsultationSetting = {
  hotline?: string | null;
  callback_title?: string | null;
  callback_description?: string | null;
  form_title?: string | null;
  office_name?: string | null;
  office_address?: string | null;
  address?: string | null;
  working_hours?: string | null;
  email?: string | null;
  is_callback_enabled?: boolean | null;
  is_message_form_enabled?: boolean | null;
};

export type ProjectBrochureData = {
  url?: string | null;
  project_name?: string | null;
};

export type ProjectHotlineData = {
  hotline?: string | null;
};

export const customerPublicApi = {
  news(params?: { category?: string; search?: string; page?: number; per_page?: number }) {
    return getData<NewsListData>("/api/v1/news", params);
  },

  newsDetail(idOrSlug: string) {
    return getData<NewsDetailData>(`/api/v1/news/${encodeURIComponent(idOrSlug)}`);
  },

  likeNews(id: string) {
    return postData<NewsLikeData>(`/api/v1/news/${encodeURIComponent(id)}/like`, {});
  },

  projects(params?: { search?: string; location?: string; type?: string; status?: string; page?: number; per_page?: number }) {
    return getData<PaginatedData<PublicProject>>("/api/v1/public/projects", params);
  },

  searchProjects(params: { q: string; per_page?: number; page?: number }) {
    return getData<PaginatedData<PublicProject>>("/api/v1/public/projects/search", params);
  },

  projectDetail(id: string) {
    return getData<PublicProject>(`/api/v1/public/projects/${encodeURIComponent(id)}`);
  },

  projectBrochure(id: string) {
    return getData<ProjectBrochureData>(`/api/v1/public/projects/${encodeURIComponent(id)}/brochure`);
  },

  projectHotline(id: string) {
    return getData<ProjectHotlineData>(`/api/v1/public/projects/${encodeURIComponent(id)}/hotline`);
  },

  plannings(params?: { search?: string; city?: string; page?: number; per_page?: number }) {
    return getData<PaginatedData<PublicPlanning>>("/api/v1/public/plannings", params);
  },

  planningCities() {
    return getData<string[]>("/api/v1/public/plannings/cities");
  },

  planningDetail(id: string) {
    return getData<PublicPlanning>(`/api/v1/public/plannings/${encodeURIComponent(id)}`);
  },

  legalVideos(params?: { category?: string; search?: string; page?: number; per_page?: number }) {
    return getData<LegalVideoListData>("/api/v1/legal-videos", params);
  },

  legalVideoDetail(idOrSlug: string) {
    return getData<LegalVideoDetailData>(`/api/v1/legal-videos/${encodeURIComponent(idOrSlug)}`);
  },

  consultationSetting() {
    return getData<ConsultationSetting>("/api/v1/public/consultation/setting");
  },

  requestCallback(input: {
    full_name: string;
    phone: string;
    preferred_callback_time: string;
    email?: string;
    project_id?: string;
    project_name?: string;
  }) {
    return postData("/api/v1/public/consultation/callback", input);
  },

  submitConsultation(input: {
    full_name: string;
    phone: string;
    email?: string;
    project_id?: string;
    project_name?: string;
    content?: string;
  }) {
    return postData("/api/v1/public/consultation/submit", input);
  }
};
