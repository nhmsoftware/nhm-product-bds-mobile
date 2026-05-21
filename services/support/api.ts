import { getData, postData } from "@/libs/api";
import type {
  SupportTicketMessage,
  SupportTicket,
  SupportTicketThread
} from "@/services/support/types";

export const supportApi = {
  list(params?: { page?: number; keyword?: string; status?: number }) {
    return getData<SupportTicket[]>("/api/tickets", params);
  },

  create(input: { type: number; priority: number; message: string }) {
    return postData<SupportTicket>("/api/tickets", input);
  },

  thread(ticketId: string, page = 1) {
    return getData<SupportTicketThread>(`/api/tickets/${ticketId}`, { page });
  },

  reply(ticketId: string, message: string) {
    return postData<SupportTicketMessage>(`/api/tickets/${ticketId}/reply`, {
      message
    });
  }
};
