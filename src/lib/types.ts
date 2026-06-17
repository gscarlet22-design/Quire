export type CatalogEntry = {
  sourceId: string;
  externalId: string;
  title: string;
  author: string;
  language?: string;
  coverUrl?: string;
  acquire: { kind: 'url'; url: string } | { kind: 'proxy'; ref: string };
};

export interface SourceAdapter {
  id: string;
  name: string;
  search(query: string, page?: number): Promise<CatalogEntry[]>;
}
