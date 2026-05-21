export type SupportTicket = {
  id: string;
  type: string;
  typeValue: number;
  priority: string;
  priorityValue: number;
  status: string;
  statusValue: number;
  message: string;
  createdAtUtc: string;
};

export type SupportTicketMessage = {
  id: string;
  isStaff: boolean;
  message: string;
  createdAtUtc: string;
};

export type SupportTicketThread = {
  ticket: SupportTicket;
  messages: SupportTicketMessage[];
};
