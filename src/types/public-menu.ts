export interface PublicAddon {
  id: string;
  name: string;
  price: number;
}

export interface PublicMenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  available: boolean;
  addons: PublicAddon[];
}

export interface PublicCategory {
  id: string;
  name: string;
  sort_order: number;
  items: PublicMenuItem[];
}

export interface PublicMenuResponse {
  tenant: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    cover_url: string | null;
    primary_color: string | null;
    currency: string;
    waiter_call_enabled: boolean;
  };
  table: {
    id: string;
    number: number;
    qr_token: string;
  };
  categories: PublicCategory[];
}
