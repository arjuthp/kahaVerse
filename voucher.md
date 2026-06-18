# KAHA Verse — Voucher & Promotions System
## Implementation Specification (v1)

**Status:** Proposed
**Scope:** Extends existing `vouchers`, `order_entity`, `loyalty_config` entities. Additive/non-breaking where possible.

---

## 1. Current State (Baseline)

The existing system supports **one voucher source**: loyalty-point redemption.

- `vouchers` table = per-user instances, generated when a customer redeems `loyalty_points` (`pointsUsed`).
- One voucher = one discount code = one user = one use.
- `order_entity.discountAmount` = single numeric field, supports exactly one voucher per order.
- Scoping is per-`businessId` (branch-level only). No platform-wide voucher concept.
- No campaign/template concept — every voucher is a unique generated instance, not an instance of a reusable rule.

**This baseline stays fully functional.** Everything below is additive.

---

## 1A. Phase 0 — Pre-requisite Bugfix (COMPLETED)

The pre-requisite bugfixes for the existing loyalty-voucher flow have been fully implemented, hardened against concurrency race conditions, and verified via automated integration tests.

### Hardened Architecture Design
1. **Validation-First and Side-Effect Free**: Decoupled validation from consumption. All checkout paths call the read-only `validateVoucherForCheckout` which calculates discounts without modifying database states. The side-effect of marking vouchers as expired on-the-fly was removed for true preview safety.
2. **Atomic Single-Save Transactions**: In both `createOrder` and `createOrderFromCart`, the order generation, item details, addons, status records, and voucher consumption are wrapped in a single database transaction (`this.dataSource.transaction`). If the voucher redemption fails, the entire order is rolled back cleanly.
3. **Atomic Multi-Use Guard**: Built a conditional update check in `redeemVoucher` verifying that the voucher is active and that the total count hasn't reached the limit. Postgres status transitions are dynamically handled within the query via:
   ```sql
   status = CASE WHEN "maxUses" IS NOT NULL AND "usageCount" + 1 >= "maxUses" THEN 'used'::vouchers_status_enum ELSE 'active'::vouchers_status_enum END
   ```
4. **Millisecond-Level Collision Protection**: Added a random 4-digit suffix to the generated `orderNumber` (e.g. `ORD-${Date.now()}-${randomPart}`) to prevent database unique constraint collisions when concurrent checkouts happen at the same millisecond.

### Finalized Phase 0 Implementation

#### 1. Loyalty Service (`loyalty.service.ts`)
```typescript
  async validateVoucher(code: string, userId: string, businessId?: string): Promise<VoucherEntity> {
    const voucher = await this.voucherRepo.findOne({ where: { code } });
    if (!voucher) throw new NotFoundException('Voucher not found');
    if (voucher.userId !== userId) throw new BadRequestException('Voucher does not belong to this customer');
    if (voucher.status !== VoucherStatus.ACTIVE) throw new BadRequestException(`Voucher is ${voucher.status}`);
    if (voucher.expiresAt && new Date() > voucher.expiresAt) {
      throw new BadRequestException('Voucher has expired');
    }
    if (!voucher.isActive) throw new BadRequestException('Voucher is inactive');
    if (businessId && voucher.businessId !== businessId) {
      throw new BadRequestException('Voucher is not valid for this restaurant');
    }
    if (voucher.maxUses !== null && voucher.maxUses !== undefined && voucher.usageCount >= voucher.maxUses) {
      throw new BadRequestException('Voucher usage limit reached');
    }
    return voucher;
  }

  async redeemVoucher(voucherId: string, orderId: string, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(VoucherEntity) : this.voucherRepo;

    const qb = repo.createQueryBuilder('voucher')
      .update(VoucherEntity)
      .set({
        status: () => `CASE WHEN "maxUses" IS NOT NULL AND "usageCount" + 1 >= "maxUses" THEN '${VoucherStatus.USED}'::vouchers_status_enum ELSE '${VoucherStatus.ACTIVE}'::vouchers_status_enum END`,
        usedOnOrderId: orderId,
        usageCount: () => '"usageCount" + 1',
      })
      .where('id = :voucherId', { voucherId })
      .andWhere('status = :status', { status: VoucherStatus.ACTIVE })
      .andWhere('("maxUses" IS NULL OR "usageCount" < "maxUses")');

    const result = await qb.execute();
    if (result.affected === 0) {
      throw new BadRequestException('Voucher could not be redeemed or is already used');
    }
  }
```

#### 2. Order Service (`order.service.ts`)
```typescript
  async createOrder(body: CreateOrderDto, userId: string): Promise<any> {
    // 1. Calculate order items in memory...
    // 2. Validate voucher BEFORE saving anything
    let discountAmount = 0;
    let appliedVoucher = null;
    if (body.voucherCode) {
      const result = await this.loyaltyService.validateVoucherForCheckout(
        body.voucherCode,
        userId,
        body.businessId,
        subtotal,
      );
      discountAmount = result.discountAmount;
      appliedVoucher = result.voucher;
    }

    // 3. Compute final totals...
    // 4. Save order ONCE within database transaction
    const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const order = await this.dataSource.transaction(async (manager) => {
      const savedOrder = await manager.save(OrderEntity, {
        ...rest,
        userId,
        orderNumber,
        subtotal,
        taxAmount,
        deliveryFee,
        serviceCharge,
        discountAmount,
        tipAmount,
        totalAmount,
      });

      // 5. Save order items and addons using manager...
      // 6. Redeem/consume voucher after successful order creation
      if (appliedVoucher) {
        await this.loyaltyService.redeemVoucher(appliedVoucher.id, savedOrder.id, manager);
      }

      // 7. Save initial order status using manager...
      return savedOrder;
    });

    return { message: "Order created successfully", orderId: order.id, order };
  }
```

### Integration & Concurrency Test Results

An integration test suite (`test-voucher-race-v2.ts`) was executed to fire concurrent checkout attempts on a single voucher.

#### Case 1: Single-Use Voucher (`maxUses = 1`) with 2 Concurrent Checkouts
*   **Results**:
    *   **Call 1**: Succeeded (`Order ID: 342a5858-cc07-402c-95de-a911cea7e65d`)
    *   **Call 2**: Failed (`Reason: Voucher is used`)
*   **Database Audit**: Exactly **1** order record was found in the DB. The transaction block rolled back the losing checkout attempt completely, ensuring no orphaned/free orders were persisted.
*   **Voucher State**: `status = used`, `usageCount = 1`.

#### Case 2: Multi-Use Voucher (`maxUses = 3`) with 5 Concurrent Checkouts
*   **Results**:
    *   **Call 1**: Succeeded (`Order ID: 0018b392-b6e4-4ab1-b6e0-2693b52f9e13`)
    *   **Call 2**: Succeeded (`Order ID: d40012c5-edbb-4e08-a568-fe51883c5917`)
    *   **Call 3**: Succeeded (`Order ID: fb5eefc7-dd31-4c86-9f51-10a386c480d1`)
    *   **Call 4**: Failed (`Reason: Voucher could not be redeemed or is already used`)
    *   **Call 5**: Failed (`Reason: Voucher could not be redeemed or is already used`)
*   **Database Audit**: Exactly **3** order records exist in the database for the test user.
*   **Voucher State**: `status = used`, `usageCount = 3`.

This completes Phase 0 with absolute transactional safety. Ready to begin Phase 1.

---

## §1B — Phase 3 Sub-step 2: Redemption Logging (current work)

### Context

Sub-step 1 (campaign-aware validation) implemented **read** queries against
`voucher_redemption_log` for campaign limit checks (`maxRedemptionsTotal`,
`maxRedemptionsPerUser`, `maxRedemptionsPerUserPerDay`). Those checks are
correct but trivially pass in production today because nothing writes to
the table yet. Sub-step 2 closes that gap.

### What this sub-step adds

| Location | Change |
|---|---|
| `redeemVoucher` | Writes a `SUCCESS` log row inside the existing transaction after atomic voucher update succeeds |
| `redeemVoucher` | Increments `campaign.totalRedeemedAmount` inside the same transaction (campaign-linked vouchers only) |
| `redeemVoucher` | Two new parameters: `voucher: VoucherEntity`, `discountAmount: number` |
| `validateVoucherForCheckout` | try/catch wrapper writes a `FAILURE` log row on any validation rejection, then re-throws |
| Failure logging | Best-effort only — a log insert failure must not propagate to the caller |

### Invariants that must hold after this sub-step

1. **Log row and voucher update are atomic**: if `redeemVoucher`'s DB update
   rolls back (e.g. concurrent redemption on a single-use voucher), the
   `SUCCESS` log row must also roll back. Both must use the same
   `EntityManager` transaction.

2. **`totalRedeemedAmount` is accurate**: after N successful campaign
   redemptions of discount amount D each, `campaign.totalRedeemedAmount`
   must equal `N × D`. Only incremented for `campaignId IS NOT NULL` vouchers.

3. **Legacy loyalty vouchers unaffected**: `campaignId = NULL` vouchers
   produce log rows with `campaignId = null` and skip the
   `totalRedeemedAmount` increment. All existing concurrency test results
   must be identical (Case 1 single-use, Case 2 multi-use maxUses=3).

4. **Campaign limit checks now enforce in production**: the
   `maxRedemptionsPerUser` test from Sub-step 1 must pass without manually
   seeding log rows — the checkout flow itself writes them.

5. **Failure logging is best-effort**: a failure in the log insert must
   never block the checkout error from reaching the caller.

### Signature change to `redeemVoucher`

```typescript
// BEFORE (Sub-step 1)
async redeemVoucher(
  voucherId: string,
  orderId: string,
  manager?: EntityManager,
): Promise<void>

// AFTER (Sub-step 2)
async redeemVoucher(
  voucherId: string,
  orderId: string,
  voucher: VoucherEntity,       // NEW — for log row + campaign increment
  discountAmount: number,        // NEW — for log row + budget tracking
  manager?: EntityManager,
): Promise<void>
```

All call sites (currently only inside `createOrder` / `createOrderFromCart`
transaction blocks) must be updated to pass the `voucher` object and
`discountAmount` that are already in scope at the call site.

### `validateVoucherForCheckout` wrapper shape

```typescript
async validateVoucherForCheckout(...): Promise<{ voucher; discountAmount }> {
  try {
    // ... existing validation logic (unchanged) ...
    return { voucher, discountAmount };
  } catch (err) {
    // best-effort failure log — never throws
    try {
      await this.redemptionLogRepo.save({
        voucherId: voucher?.id ?? null,
        campaignId: voucher?.campaignId ?? null,
        userId,
        businessId,
        orderId: null,
        attemptedCode: code,
        result: VoucherRedemptionResult.FAILURE,
        discountAmountApplied: 0,
        rejectionReason: err?.message ?? 'UNKNOWN',
      });
    } catch (_logErr) {
      // swallow — logging must not mask the real error
    }
    throw err;  // re-throw original
  }
}
```

### Acceptance criteria (verified by agent test output)

- [ ] `npm run build` — zero errors after signature change propagated
- [ ] Concurrency Case 1 (single-use): 1 SUCCESS log row, `campaignId = null`,
      `discountAmountApplied` matches order's `discountAmount`
- [ ] Concurrency Case 2 (multi-use maxUses=3): 3 SUCCESS log rows, 2 failed
      attempts produce 2 FAILURE log rows with `rejectionReason = 'Voucher could
      not be redeemed or is already used'`
- [ ] Campaign limit test (maxRedemptionsPerUser=2, 3 attempts, no manual
      log seeding): 2 SUCCESS rows, 1 FAILURE row with
      `rejectionReason = 'USER_REDEMPTION_LIMIT_REACHED'`
- [ ] `campaign.totalRedeemedAmount` = sum of successful discount amounts
      after campaign limit test
- [ ] `voucher_redemption_log` table empty after cleanup (test hygiene)

### Known gap closed by this sub-step

> **From Sub-step 1 report**: "These checks will currently always pass
> trivially since the table is empty, until the logging sub-step lands."

After Sub-step 2, this gap is resolved. Campaign limit enforcement is
live in production.

---

## Phase 3 Remaining Sub-steps (not yet started)

| Sub-step | Scope | Spec ref |
|---|---|---|
| **Sub-step 3** | Eligibility rules: `applicableServiceTypes`, first-order check, `validDaysOfWeek` / `validTimeStart` / `validTimeEnd`, category/item scope | §4 steps 4–9 |
| **Sub-step 4** | Stacking logic: discount class separation, `appliedVoucherIds` on order, multi-voucher application order | §4 steps 13–15, §6 |
| **Sub-step 5** | Admin Campaign CRUD API + Admin Voucher Award Dashboard | §7, §8 |

Sub-steps 3 and 4 extend `validateVoucherForCheckout` further (adding more
`if` branches to the validation chain). Sub-step 5 is a new feature surface
(admin endpoints + frontend dashboard) and does not touch the checkout
validation path.

---

## Migration status tracker

| Phase | Description | Status |
|---|---|---|
| Phase 0 | Pre-requisite bugfix (silent failure, triple-save, security gaps) | ✅ Done |
| Phase 1 | Schema: `voucher_campaign`, `voucher_redemption_log`, additive columns | ✅ Done |
| Phase 2 | Backfill (implicit — handled by migration column defaults) | ✅ Done |
| Phase 3 Sub-step 1 | Campaign-aware validation (steps 1–3, 10, 12 extended) | ✅ Done |
| Phase 3 Sub-step 2 | Redemption logging + budget increment | 🔄 In progress |
| Phase 3 Sub-step 3 | Eligibility rules (steps 4–9) | ⏳ Pending |
| Phase 3 Sub-step 4 | Stacking logic (steps 13–15) | ⏳ Pending |
| Phase 3 Sub-step 5 | Admin Campaign CRUD + Voucher Award Dashboard | ⏳ Pending |

---

## 2. What We're Building

A **campaign-based promotion layer** on top of the existing loyalty-voucher system, supporting:

1. Admin-created promotional campaigns (not just loyalty-redemption vouchers)
2. Platform-wide vouchers (KAHA Verse-issued) — all v1 campaigns are platform-scoped
3. Multiple discount classes (order total, delivery fee, service charge, item-specific) so vouchers can stack correctly
4. Rich eligibility rules: service type, order sequence (first-order), category/item scope, day/time windows, redemption caps
5. A reservation-based redemption lifecycle (active → reserved → used / released)
6. A redemption audit log for fraud detection and customer support

> **Note on branch-level vouchers:** Branch (restaurant-specific) voucher campaigns are **deferred to v2**, pending the branch/restaurant onboarding feature being built separately. The schema below includes the `businessId` field on `voucher_campaign` as nullable and forward-compatible, but for v1 it is **always NULL** (platform-wide). No branch-scoped validation logic is implemented in v1. See §11.

---

## 3. New / Modified Entities

### 3.1 `voucher_campaign` (NEW TABLE)

The reusable "rule template." One row = one promotional campaign that can issue many `vouchers` instances.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `businessId` | string, nullable | **v1: always NULL** (platform-wide, KAHA Verse-issued). Branch-specific (non-NULL) campaigns are v2, pending branch onboarding — see §11 |
| `name` | string | Internal campaign name, e.g. "Dashain 2026 First Order" |
| `code` | string, nullable, unique | If set, customers enter this code manually. NULL = auto-issued only |
| `codePattern` | string, nullable | e.g. `KAHA-####` for bulk unique-code generation |
| `discountType` | enum: `FIXED`, `PERCENTAGE` | |
| `discountValue` | numeric | |
| `maxDiscountAmount` | numeric, nullable | Cap for percentage discounts |
| `minOrderAmount` | numeric, nullable | Minimum cart subtotal |
| `discountClass` | enum: `ORDER_TOTAL`, `DELIVERY_FEE`, `SERVICE_CHARGE`, `ITEM_SPECIFIC` | Determines which order field is discounted and how stacking works |
| `applicableServiceTypes` | enum array, nullable | `DINE_IN`, `TAKEAWAY`, `DELIVERY`. NULL = all |
| `applicableCategoryIds` | string array, nullable | Restrict to menu categories. NULL = all |
| `applicableMenuItemIds` | string array, nullable | Restrict to specific items. NULL = all |
| `requiresFirstOrder` | boolean, default false | Only valid on customer's 1st order for this `businessId` |
| `applicableOrderSequence` | int array, nullable | e.g. `[1,2,3]` for "valid on 1st/2nd/3rd order" |
| `validDaysOfWeek` | int array, nullable | 0=Sun..6=Sat. NULL = all days |
| `validTimeStart` / `validTimeEnd` | time, nullable | Time-of-day window (e.g. lunch specials) |
| `maxRedemptionsTotal` | int, nullable | Campaign-wide redemption cap |
| `maxRedemptionsPerUser` | int, nullable | |
| `maxRedemptionsPerUserPerDay` | int, nullable | Fraud control |
| `totalBudgetCap` | numeric, nullable | Max total discount NPR across all redemptions |
| `totalRedeemedAmount` | numeric, default 0 | Running counter, updated on each successful redemption |
| `stackPriority` | int, default 0 | Lower = applied first when stacking |
| `combinesWith` | enum array, nullable | Which `discountClass` values this can stack with. NULL = none |
| `startsAt` / `expiresAt` | timestamp, nullable | Campaign validity window |
| `status` | enum: `draft`, `active`, `paused`, `expired` | `draft` = pending approval |
| `createdBy` | UUID (User) | |

### 3.2 `vouchers` (MODIFIED)

Existing table extended with campaign linkage and richer state tracking.

**New fields:**

| Field | Type | Notes |
|---|---|---|
| `campaignId` | UUID, nullable, FK → `voucher_campaign.id` | NULL = legacy loyalty-redemption voucher (unchanged behavior) |
| `discountClass` | enum, default `ORDER_TOTAL` | Mirrors campaign's class; copied at issuance for stability |
| `applicableServiceTypes` | enum array, nullable | Mirrors campaign at issuance |

**Status enum extended:**

`active` → `reserved` → `used` | `expired`
(`reserved` is NEW — see §5 Reservation Flow)

**Existing fields unchanged:** `userId`, `businessId`, `code`, `discountType`, `discountValue`, `maxDiscountAmount`, `minOrderAmount`, `maxUses`, `usageCount`, `maxUsesPerUser`, `pointsUsed`, `usedOnOrderId`, `expiresAt`.

### 3.3 `order_entity` (MODIFIED)

**Replace single `discountAmount` with breakdown fields:**

| Field | Type | Notes |
|---|---|---|
| `orderDiscountAmount` | numeric, default 0 | From `ORDER_TOTAL` class vouchers |
| `deliveryDiscountAmount` | numeric, default 0 | From `DELIVERY_FEE` class vouchers |
| `serviceChargeDiscountAmount` | numeric, default 0 | From `SERVICE_CHARGE` class vouchers |
| `itemDiscountAmount` | numeric, default 0 | From `ITEM_SPECIFIC` class vouchers |
| `discountAmount` | numeric | **KEPT** as computed sum of the four above, for backward compatibility with existing reports/UI |
| `appliedVoucherIds` | string array | All voucher IDs applied to this order (supports stacking) |

### 3.4 `voucher_redemption_log` (NEW TABLE)

Audit trail — every validation attempt, success or failure.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `voucherId` | UUID, nullable | NULL if code didn't match any voucher |
| `campaignId` | UUID, nullable | |
| `userId` | string | |
| `businessId` | string | |
| `orderId` | UUID, nullable | Set only if redemption proceeded to order placement |
| `attemptedCode` | string | Raw code entered (even if invalid) |
| `result` | enum: `success`, `rejected`, `released` | |
| `rejectionReason` | string, nullable | e.g. `MIN_ORDER_NOT_MET`, `EXPIRED`, `SERVICE_TYPE_MISMATCH`, `BUDGET_EXCEEDED`, `ALREADY_USED`, `OUTSIDE_TIME_WINDOW` |
| `discountAmountApplied` | numeric, nullable | |
| `createdAt` | timestamp | |

---

## 4. Validation Pipeline (Checkout)

Executed in this fixed order. First failure short-circuits and returns `rejectionReason` to the client.

| Step | Check | Rejection Reason Code |
|---|---|---|
| 1 | Voucher/code exists, `status` is `active` | `CODE_NOT_FOUND` |
| 2 | Not expired (`expiresAt`) | `EXPIRED` |
| 3 | Ownership match (`userId`) for user-bound vouchers | `NOT_OWNED` |
| 4 | `businessId` scope: **v1 — always passes** since `campaign.businessId` is always NULL (platform-wide). v2 will check `campaign.businessId` is NULL OR matches `cart.businessId` | `BUSINESS_SCOPE_MISMATCH` (v2) |
| 5 | `applicableServiceTypes` includes `cart.serviceType` (or NULL = all) | `SERVICE_TYPE_MISMATCH` |
| 6 | If `requiresFirstOrder`: user has zero prior orders for this `businessId` | `NOT_FIRST_ORDER` |
| 7 | If `applicableOrderSequence` set: user's next order number is in the array | `ORDER_SEQUENCE_MISMATCH` |
| 8 | `validDaysOfWeek` includes today (or NULL = all) | `OUTSIDE_VALID_DAYS` |
| 9 | Current time within `validTimeStart`–`validTimeEnd` (or NULL = all) | `OUTSIDE_TIME_WINDOW` |
| 10 | `minOrderAmount` ≤ cart subtotal | `MIN_ORDER_NOT_MET` |
| 11 | If `applicableCategoryIds`/`applicableMenuItemIds` set: at least one matching cart line item | `NO_ELIGIBLE_ITEMS` |
| 12 | `maxUses` / `maxUsesPerUser` / `maxRedemptionsPerUser` / `maxRedemptionsPerUserPerDay` not exceeded | `REDEMPTION_LIMIT_REACHED` |
| 13 | `maxRedemptionsTotal` not exceeded | `CAMPAIGN_LIMIT_REACHED` |
| 14 | `totalRedeemedAmount + projectedDiscount` ≤ `totalBudgetCap` (if set) | `BUDGET_EXCEEDED` |
| 15 | Stacking check: if other vouchers already applied to cart, `combinesWith` permits this `discountClass` | `STACKING_NOT_ALLOWED` |

Every attempt (pass or fail) writes a `voucher_redemption_log` row.

---

## 5. Reservation Flow (Lifecycle)

Prevents single-use vouchers from being consumed by orders that fail payment.

```
ACTIVE ──(validation passes, order created)──> RESERVED
RESERVED ──(payment confirmed)──> USED
RESERVED ──(payment failed / order cancelled)──> ACTIVE   [budget hold released]
ACTIVE ──(expiresAt passed)──> EXPIRED
```

**On order placement (validation passes):**
1. Set `voucher.status = 'reserved'`
2. Increment `voucher_campaign.totalRedeemedAmount` (soft hold)
3. Write `voucher_redemption_log` with `result = 'success'`, `orderId` set
4. Populate `order_entity` discount fields per §3.3

**On payment success:**
1. Set `voucher.status = 'used'`, `voucher.usedOnOrderId = order.id`, increment `voucher.usageCount`

**On payment failure / order cancellation:**
1. Set `voucher.status = 'active'`
2. Decrement `voucher_campaign.totalRedeemedAmount`
3. Write `voucher_redemption_log` row with `result = 'released'`

---

## 6. Stacking Rules

Default `discountClass` evaluation order (lowest `stackPriority` first):

1. `ITEM_SPECIFIC`
2. `ORDER_TOTAL`
3. `DELIVERY_FEE`
4. `SERVICE_CHARGE`

Each voucher's `combinesWith` array lists which OTHER classes it tolerates alongside it. A voucher with `combinesWith = NULL` cannot stack with anything (default for legacy loyalty vouchers — preserves current single-voucher behavior).

**Example:** A `DELIVERY_FEE` free-delivery campaign with `combinesWith = ['ORDER_TOTAL']` can be applied together with a loyalty `ORDER_TOTAL` voucher, discounting both `deliveryFee` and `subtotal` independently on the same order.

---

## 7. Distribution Mechanisms

| Mechanism | How it works | Campaign config |
|---|---|---|
| Loyalty redemption (existing) | User spends points → `vouchers` row created, `campaignId = NULL` | n/a |
| Manual code entry | User types `voucher_campaign.code` at checkout → system creates/finds matching `vouchers` instance | `code` set |
| Bulk unique codes | Pre-generate N `vouchers` rows from `codePattern` (e.g. `KAHA-A1B2`), distributed via SMS/email | `codePattern` set |
| Auto-issued (event-triggered) | Backend job creates `vouchers` row on signup/birthday/win-back, `status = active`, visible in "My Vouchers" | `code = NULL`, triggered by event hooks |

---

## 8. API Surface (New/Changed Endpoints)

| Endpoint | Method | Purpose |
|---|---|---|
| `/admin/voucher-campaigns` | POST | Create campaign (status defaults to `draft`) |
| `/admin/voucher-campaigns/:id/activate` | POST | Approve & activate (draft → active) |
| `/admin/voucher-campaigns/:id` | GET/PATCH | View/edit campaign |
| `/admin/voucher-campaigns/:id/redemptions` | GET | Redemption log for this campaign (success + failures) |
| `/cart/apply-voucher` | POST | Run validation pipeline (§4), returns success + discount breakdown OR rejection reason |
| `/cart/remove-voucher` | POST | Remove an applied voucher pre-checkout |
| `/users/:id/vouchers` | GET | "My Vouchers" wallet — active/reserved/used vouchers for user |

---

## 9. Migration Plan (Phased, Non-Breaking)

**Phase 0 — Pre-requisite bugfix** (see §1A) — ship first, standalone, no schema migration. Splits `applyVoucher` into `validateVoucher` (read-only) + `redeemVoucher` (mutating), fixing the silent-failure, triple-save, and security gap issues in the existing loyalty-voucher flow.

**Phase 1 — Additive columns** (zero downtime, defaults preserve current behavior)
```sql
ALTER TABLE vouchers
  ADD COLUMN campaign_id UUID NULL REFERENCES voucher_campaign(id),
  ADD COLUMN discount_class VARCHAR DEFAULT 'ORDER_TOTAL',
  ADD COLUMN applicable_service_types TEXT[] NULL;

ALTER TABLE order_entity
  ADD COLUMN order_discount_amount NUMERIC DEFAULT 0,
  ADD COLUMN delivery_discount_amount NUMERIC DEFAULT 0,
  ADD COLUMN service_charge_discount_amount NUMERIC DEFAULT 0,
  ADD COLUMN item_discount_amount NUMERIC DEFAULT 0,
  ADD COLUMN applied_voucher_ids TEXT[] DEFAULT '{}';
  -- existing discountAmount column kept, becomes a computed/synced sum
```

**Phase 2 — New tables**
```sql
CREATE TABLE voucher_campaign ( ... per §3.1 ... );
CREATE TABLE voucher_redemption_log ( ... per §3.4 ... );
```

**Phase 3 — Backfill**
- Existing `vouchers` rows: `campaign_id = NULL`, `discount_class = 'ORDER_TOTAL'`, `applicable_service_types = NULL` (all) — fully preserves current behavior, no re-validation needed.

**Phase 4 — Application layer**
- Implement validation pipeline (§4) as a single service function extending Phase 0's `validateVoucher`, called by `/cart/apply-voucher`.
- Implement reservation lifecycle hooks (§5) in order-placement and payment-webhook handlers, extending Phase 0's `redeemVoucher`.
- Existing loyalty-redemption flow continues to call the same validation pipeline — campaign-specific checks (steps 4–9, 13–15) simply no-op when `campaignId IS NULL`.

**Phase 5 — Admin tooling**
- Build `/admin/voucher-campaigns` CRUD + approval workflow.
- Build redemption analytics dashboard from `voucher_redemption_log`.

---

## 11. Deferred: Branch-Level Vouchers (v2)

Once the branch/restaurant onboarding feature exists, the following becomes addable **without further schema changes** (fields already present from v1):

- Set `voucher_campaign.businessId` to a specific restaurant's ID to scope a campaign to that branch.
- Re-enable validation step 4 (`BUSINESS_SCOPE_MISMATCH`): cart's `businessId` must match the campaign's `businessId`, unless `businessId IS NULL` (platform-wide campaigns continue to apply everywhere).
- Add branch-owner role permissions to `/admin/voucher-campaigns` so restaurant owners can create campaigns scoped to only their own `businessId` (platform admins retain ability to create `businessId = NULL` platform-wide campaigns).
- Add `voucher_campaign.createdBy` role check: branch owners restricted to creating campaigns where `businessId = their own restaurant`.

**No migration required for this transition** — it's purely an application-layer validation + permissions change, since the `businessId` column and its NULL-check logic are already part of the v1 schema (currently always NULL / always-pass).

---

## 12. Out of Scope (v1)

- Branch-level (restaurant-specific) voucher campaigns — see §11, deferred until branch onboarding ships
- Referral-linked vouchers (future: `voucher_campaign.triggerEvent = 'referral_success'`)
- A/B testing / experimentation framework for campaigns
- Multi-restaurant cart support (DoubleDash-style) — `businessId` scoping assumes single-vendor cart
- POS-issued vouchers for dine-in staff workflows
- External CRM/CEP webhook integrations

These are noted as natural extensions once v1's campaign + stacking + validation foundation is in place.
