import { ViewModeId } from './evt-models';

export interface SiteConfig {
  defaultEdition: string;
  editions: SiteEditionEntry[];
}

export interface SiteEditionEntry {
  slug: string;
  label: string;
  configBase: string;
  defaultViewMode?: ViewModeId;
  enabled?: boolean;
}
