import { VoucherDiscountType } from '../../entities/voucher.entity';

export function calculateDiscount(
  discountType: VoucherDiscountType,
  discountValue: number,
  cartTotal: number,
  maxDiscountAmount?: number
): number {
  let discount = 0;

  if (discountType === VoucherDiscountType.FIXED) {
    discount = Math.min(Number(discountValue), cartTotal);
  } else if (discountType === VoucherDiscountType.PERCENTAGE) {
    const raw = cartTotal * (Number(discountValue) / 100);
    if (maxDiscountAmount !== undefined && maxDiscountAmount !== null) {
      discount = Math.min(raw, Number(maxDiscountAmount));
    } else {
      discount = raw;
    }
  }

  // Round to 2 decimal places
  return Math.round((discount + Number.EPSILON) * 100) / 100;
}
