export type WalletTransaction = {
  id: string;
  type: string;
  typeValue: number;
  status: string;
  statusValue: number;
  money: number;
  balanceBefore: number;
  balanceAfter: number;
  note?: string | null;
  createdAtUtc: string;
};

export type WalletTransactionPage = {
  items?: WalletTransaction[];
  Items?: WalletTransaction[];
  page?: number;
  Page?: number;
  pageSize?: number;
  PageSize?: number;
  totalCount?: number;
  TotalCount?: number;
};
