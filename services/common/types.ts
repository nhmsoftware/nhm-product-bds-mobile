export type Bank = {
  id: string;
  bin: string;
  code: string;
  shortName: string;
  name: string;
};

export type AppConfig = {
  key: string;
  value: string;
  description?: string | null;
};
