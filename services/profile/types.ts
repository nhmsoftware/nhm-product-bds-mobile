export type CustomerProfile = {
  id: string;
  cccd?: string | null;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  avatar?: string | null;
  preferredCity?: string;
  budgetLabel?: string;
  demand?: "buy" | "rent" | "invest";
};

export type UpdateProfileInput = Pick<
  CustomerProfile,
  "fullName" | "email" | "phone" | "address"
>;
