export type TradingAccount = {
  id: string;
  type: string;
  typeValue: number;
  accountNumber: string;
  name: string;
  balance: number;
  activeProtectCost: boolean;
};

export type PaginatedTradingAccounts = {
  items?: TradingAccount[] | null;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
};
