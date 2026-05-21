export type BankAccount = {
  binBank?: string | null;
  accountBank?: string | null;
  accountBankName?: string | null;
};

export type UserProfile = {
  id: string;
  fullName: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string | null;
  gender: string;
  genderValue: number;
  phoneNumber?: string | null;
  address?: string | null;
  money: number;
  verificationStatus: string;
  verificationStatusValue: number;
  referralCode: string;
  bank?: BankAccount | null;
  isActive: boolean;
};

export type UpdateProfileInput = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: number;
  phoneNumber: string;
  address: string;
};

export type SubmitKycInput = UpdateProfileInput & {
  binBank: string;
  accountBank: string;
  accountBankName: string;
  cccdFrontImage?: { uri: string; name: string; type: string } | null;
  cccdBackImage?: { uri: string; name: string; type: string } | null;
};
