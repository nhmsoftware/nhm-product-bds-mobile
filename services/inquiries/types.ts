export type InquiryInput = {
  listingId?: string;
  fullName: string;
  phone: string;
  message: string;
};

export type Inquiry = InquiryInput & {
  id: string;
  status: "new" | "contacted" | "closed";
  createdAt: string;
};
