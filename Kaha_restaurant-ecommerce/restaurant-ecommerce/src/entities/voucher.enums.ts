export enum VoucherStatus {
  ACTIVE = 'active',
  USED = 'used',
  EXPIRED = 'expired',
}

export enum VoucherDiscountType {
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE',
}

export enum VoucherDiscountClass {
  ORDER_TOTAL = 'ORDER_TOTAL',
  DELIVERY_FEE = 'DELIVERY_FEE',
  SERVICE_CHARGE = 'SERVICE_CHARGE',
  ITEM_SPECIFIC = 'ITEM_SPECIFIC',
}

export enum VoucherCampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  EXPIRED = 'expired',
}
