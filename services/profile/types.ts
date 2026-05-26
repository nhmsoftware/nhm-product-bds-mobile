export type CustomerProfile = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  preferredCity: string;
  budgetLabel: string;
  demand: "buy" | "rent" | "invest";
};

export type UpdateProfileInput = Pick<
  CustomerProfile,
  "fullName" | "phone" | "preferredCity" | "budgetLabel" | "demand"
>;
