export type Importmap = {
  imports?: Record<string, string>;
  scopes?: Record<string, Record<string, string>>;
  integrity?: Record<string, string>;
};

export type Script = {
  innerHTML: string;
  attributes: Record<string, string>;
  location?: "body" | "head";
};
