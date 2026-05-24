interface addons {
  name: string;
  description: string;
  coverImg: string;
  unitPriceSnapshot?: number;
}

export class menu {
  name: string;
  price: number;
}

interface addonsWithAddisnalData extends addons {
  price: number;
  quantity: number;
  total: number;
}

export class ICartItemResponse {
  id: string;
  name: string;
  quantity: number;
  variantName?: string | null;
  unitPriceSnapshot?: number;
  addOns?: addons[];
}

export class ICartItemWithAdditionalInfo extends ICartItemResponse {
  variantName?: string | null;
  itemTotal: number;
  addonsTotal: number;
  grandTotal: number;
  addOns?: addonsWithAddisnalData[];
  menu: menu;
}
