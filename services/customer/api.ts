import { getData, postData } from "@/libs/api";

export const customerPublicApi = {
  news(params?: { category?: string; search?: string; page?: number }) {
    return getData("/api/v1/news", params);
  },

  newsDetail(idOrSlug: string) {
    return getData(`/api/v1/news/${encodeURIComponent(idOrSlug)}`);
  },

  projects(params?: { search?: string; location?: string; type?: string; page?: number }) {
    return getData("/api/v1/public/projects", params);
  },

  projectDetail(id: string) {
    return getData(`/api/v1/public/projects/${encodeURIComponent(id)}`);
  },

  projectBrochure(id: string) {
    return getData(`/api/v1/public/projects/${encodeURIComponent(id)}/brochure`);
  },

  projectHotline(id: string) {
    return getData(`/api/v1/public/projects/${encodeURIComponent(id)}/hotline`);
  },

  plannings(params?: { search?: string; city?: string; page?: number }) {
    return getData("/api/v1/public/plannings", params);
  },

  planningDetail(id: string) {
    return getData(`/api/v1/public/plannings/${encodeURIComponent(id)}`);
  },

  legalVideos(params?: { search?: string; page?: number }) {
    return getData("/api/v1/legal-videos", params);
  },

  consultationSetting() {
    return getData("/api/v1/public/consultation/setting");
  },

  submitConsultation(input: { name: string; phone: string; message?: string; project_id?: string }) {
    return postData("/api/v1/public/consultation/submit", input);
  }
};
