# Order Table Scaling Strategy - Hot vs Cold Data Separation

**Problem:** As your restaurant e-commerce grows, the order table will become bloated with mixed hot and cold data, causing performance issues.

---

## 📊 Current Structure Analysis

### Your Current Order Table (Lean - Good Start!)

```typescript
OrderEntity {
  // Core identifiers (HOT - frequently accessed)
  id, userId, businessId, orderNumber
  
  // Service info (HOT)
  serviceType, tableNumber
  
  // Pricing (WARM - read often, written once)
  subtotal, taxAmount, deliveryFee, serviceCharge
  discountAmount, tipAmount, totalAmount
  
  // Payment (HOT - updated frequently)
  paymentStatus, paymentMethod
  
  // Metadata (COLD)
  remarks
  
  // Timestamps (HOT)
  createdAt, updatedAt
}
```

**Current Status:** ✅ Good foundation, but will grow quickly

---

## 🔥 Hot vs Cold Data Explained

### Hot Data (Frequently Accessed/Updated)
Data that is:
- Read on every query
- Updated frequently
- Needed for filtering/sorting
- Used in indexes

**Examples:**
- `order_status` (PENDING → PREPARING → READY → DELIVERED)
- `payment_status` (UNPAID → PAID → REFUNDED)
- `business_id` (for filtering)
- `placed_at` (for sorting)
- `user_id` (for user orders)

**Characteristics:**
- Small size (IDs, enums, timestamps)
- High read/write frequency
- Should be in main table
- Heavily indexed

### Cold Data (Rarely Accessed)
Data that is:
- Written once, rarely read
- Large in size
- Only needed for specific views
- Not used in filtering

**Examples:**
- Customer delivery address (full JSON)
- Menu item snapshots (prices at order time)
- Coupon details
- Special instructions
- Invoice metadata
- Refund history

**Characteristics:**
- Large size (JSON, TEXT)
- Low read frequency
- Should be in separate tables
- Minimal indexing

---

## ⚠️ Problems at Scale (2500+ orders/day)

### Problem 1: Heavy Inserts

**Bad Design (Everything in One Table):**
```sql
INSERT INTO orders (
  id, user_id, business_id, order_number,
  -- 10 pricing columns
  subtotal, tax, delivery_fee, service_charge, discount, tip, total,
  -- Customer info (LARGE)
  customer_name, customer_phone, customer_email,
  delivery_address_json, -- 500 bytes
  -- Menu snapshots (VERY LARGE)
  menu_items_snapshot_json, -- 2-5 KB per order
  -- Payment details
  payment_status, payment_method, payment_transaction_id,
  -- Delivery tracking
  delivery_status, rider_id, rider_location_json,
  -- Metadata
  notes, special_instructions, coupon_details_json,
  -- Timestamps
  placed_at, confirmed_at, prepared_at, delivered_at
) VALUES (...); -- 8-10 KB per row!
```

**Impact:**
- Each insert writes 8-10 KB
- 2500 orders × 10 KB = 25 MB/day just for orders
- Disk I/O bottleneck
- Slower inserts (more data to write)

### Problem 2: Row Locking & MVCC Bloat

**Scenario:** Update order status
```sql
-- User pays for order
UPDATE orders 
SET payment_status = 'PAID', 
    paid_at = NOW() 
WHERE id = 'order-123';
```

**What Happens in PostgreSQL:**
1. **Entire row is rewritten** (even though only 2 columns changed)
2. Old row marked as dead (MVCC)
3. New row version created
4. If row is 10 KB, you write 10 KB for a 2-byte change!

**With 100 status updates/minute:**
- 100 × 10 KB = 1 MB of writes
- Old versions accumulate (bloat)
- VACUUM needed more frequently
- Table size grows 2-3x actual data

### Problem 3: Cache Inefficiency

**Common Query:**
```sql
SELECT id, order_number, status, total_amount, placed_at
FROM orders
WHERE business_id = 'biz-123'
  AND placed_at > NOW() - INTERVAL '1 day'
ORDER BY placed_at DESC
LIMIT 20;
```

**Problem:**
- PostgreSQL loads entire rows into memory
- You need 5 columns (50 bytes)
- But it loads all 40 columns (10 KB)
- 200x more data than needed!
- Cache fills up faster
- More disk reads

### Problem 4: Difficult Scaling

**Future Features You'll Add:**
```typescript
// Payment features
refund_amount, refund_reason, refund_processed_at
split_payment_details_json
loyalty_points_earned, loyalty_points_used

// Kitchen workflow
kitchen_display_order, prep_station_id
estimated_prep_time, actual_prep_time

// Rider tracking
rider_assigned_at, rider_picked_up_at
rider_current_location_json, rider_eta

// Customer experience
rating, review_text, review_images_json
complaint_filed, complaint_details_json

// Business analytics
peak_hour_flag, weather_condition
promotion_applied_json, ab_test_variant

// Invoicing
invoice_number, invoice_pdf_url
tax_invoice_details_json
```

**Result:** 50-80 columns, 15-20 KB per row 😱

---

## ✅ Solution: Hot/Cold Data Separation

### Architecture: 3-Table Design

```
┌─────────────────────────────────────────────────────────┐
│                    orders (HOT)                         │
│  - Frequently accessed/updated                          │
│  - Small, indexed columns                               │
│  - Fast reads/writes                                    │
└─────────────────────────────────────────────────────────┘
                          │
                          │ 1:1
                          ↓
┌─────────────────────────────────────────────────────────┐
│              order_details (WARM)                       │
│  - Written once, read occasionally                      │
│  - Pricing breakdown, customer info                     │
│  - Medium size                                          │
└─────────────────────────────────────────────────────────┘
                          │
                          │ 1:1
                          ↓
┌─────────────────────────────────────────────────────────┐
│              order_metadata (COLD)                      │
│  - Rarely accessed                                      │
│  - Large JSON blobs, snapshots                          │
│  - Archivable                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Recommended Schema

### Table 1: `orders` (HOT DATA)

**Purpose:** Fast queries, frequent updates, filtering, sorting

```typescript
@Entity('orders')
export class OrderEntity extends BaseEntity {
  // === IDENTIFIERS (indexed) ===
  @Column()
  @Index()
  userId: string;

  @Column()
  @Index()
  businessId: string;

  @Column({ unique: true })
  @Index()
  orderNumber: string;

  // === STATUS (frequently updated) ===
  @Column('enum', { enum: OrderStatus, default: OrderStatus.PENDING })
  @Index()
  currentStatus: OrderStatus; // PENDING, CONFIRMED, PREPARING, READY, COMPLETED, CANCELLED

  @Column('enum', { enum: PaymentStatus, default: PaymentStatus.UNPAID })
  @Index()
  paymentStatus: PaymentStatus; // UNPAID, PAID, REFUNDED, FAILED

  // === SERVICE INFO ===
  @Column('enum', { enum: ServiceType })
  serviceType: ServiceType; // DINE_IN, TAKEOUT, DELIVERY

  @Column({ nullable: true })
  tableNumber: string;

  // === PRICING (summary only) ===
  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  paidAmount: number;

  // === TIMESTAMPS (for sorting/filtering) ===
  @Column({ type: 'timestamp' })
  @Index()
  placedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  confirmedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  // === RELATIONSHIPS ===
  @OneToOne(() => OrderDetailsEntity, details => details.order)
  details: OrderDetailsEntity;

  @OneToOne(() => OrderMetadataEntity, metadata => metadata.order)
  metadata: OrderMetadataEntity;

  @OneToMany(() => OrderItemEntity, item => item.order)
  items: OrderItemEntity[];

  @OneToMany(() => OrderStatusHistoryEntity, status => status.order)
  statusHistory: OrderStatusHistoryEntity[];
}
```

**Size:** ~200 bytes per row  
**Updates:** High frequency (status changes)  
**Queries:** Every list/filter operation

---

### Table 2: `order_details` (WARM DATA)

**Purpose:** Pricing breakdown, customer info, read occasionally

```typescript
@Entity('order_details')
export class OrderDetailsEntity extends BaseEntity {
  @OneToOne(() => OrderEntity, order => order.details)
  @JoinColumn()
  order: OrderEntity;

  @Column()
  orderId: string;

  // === CUSTOMER INFO ===
  @Column()
  customerName: string;

  @Column()
  customerPhone: string;

  @Column({ nullable: true })
  customerEmail: string;

  // === PRICING BREAKDOWN ===
  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  deliveryFee: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  serviceCharge: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  tipAmount: number;

  // === PAYMENT INFO ===
  @Column('enum', { enum: PaymentMethod, nullable: true })
  paymentMethod: PaymentMethod;

  @Column({ nullable: true })
  paymentTransactionId: string;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  // === DELIVERY INFO (if applicable) ===
  @Column('jsonb', { nullable: true })
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: { lat: number; lng: number };
  };

  @Column({ nullable: true })
  deliveryInstructions: string;

  // === DISCOUNT/COUPON ===
  @Column({ nullable: true })
  couponCode: string;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  discountPercentage: number;

  // === NOTES ===
  @Column('text', { nullable: true })
  customerNotes: string;

  @Column('text', { nullable: true })
  internalNotes: string;
}
```

**Size:** ~500-800 bytes per row  
**Updates:** Rare (mostly read-only after creation)  
**Queries:** Only when viewing order details

---

### Table 3: `order_metadata` (COLD DATA)

**Purpose:** Large blobs, snapshots, rarely accessed

```typescript
@Entity('order_metadata')
export class OrderMetadataEntity extends BaseEntity {
  @OneToOne(() => OrderEntity, order => order.metadata)
  @JoinColumn()
  order: OrderEntity;

  @Column()
  orderId: string;

  // === MENU SNAPSHOTS (for price history) ===
  @Column('jsonb')
  menuItemsSnapshot: {
    menuId: string;
    name: string;
    price: number;
    variantName?: string;
    addons?: Array<{ name: string; price: number }>;
  }[];

  // === BUSINESS SNAPSHOT ===
  @Column('jsonb', { nullable: true })
  businessSnapshot: {
    name: string;
    address: string;
    phone: string;
    taxRate: number;
  };

  // === RIDER/DELIVERY TRACKING ===
  @Column('jsonb', { nullable: true })
  deliveryTracking: {
    riderId?: string;
    riderName?: string;
    riderPhone?: string;
    assignedAt?: Date;
    pickedUpAt?: Date;
    deliveredAt?: Date;
    trackingHistory?: Array<{
      timestamp: Date;
      location: { lat: number; lng: number };
      status: string;
    }>;
  };

  // === REFUND INFO ===
  @Column('jsonb', { nullable: true })
  refundDetails: {
    amount: number;
    reason: string;
    processedAt: Date;
    processedBy: string;
    refundMethod: string;
  };

  // === RATING/REVIEW ===
  @Column('jsonb', { nullable: true })
  customerFeedback: {
    rating?: number;
    review?: string;
    images?: string[];
    submittedAt?: Date;
  };

  // === ANALYTICS DATA ===
  @Column('jsonb', { nullable: true })
  analyticsData: {
    peakHour?: boolean;
    weatherCondition?: string;
    promotionApplied?: string;
    abTestVariant?: string;
    deviceType?: string;
    referralSource?: string;
  };

  // === INVOICE DATA ===
  @Column('jsonb', { nullable: true })
  invoiceData: {
    invoiceNumber?: string;
    invoicePdfUrl?: string;
    taxInvoiceDetails?: any;
  };
}
```

**Size:** 2-5 KB per row  
**Updates:** Very rare  
**Queries:** Only for specific views (order history, analytics)

---

## 📈 Performance Comparison

### Before (Single Table)

```sql
-- List today's orders
SELECT * FROM orders 
WHERE business_id = 'biz-123' 
  AND placed_at > CURRENT_DATE
ORDER BY placed_at DESC;

-- Row size: 10 KB
-- 100 orders = 1 MB loaded
-- Cache: Fills quickly
-- Index: Large (includes all columns)
```

### After (Separated Tables)

```sql
-- List today's orders (HOT data only)
SELECT id, order_number, current_status, total_amount, placed_at
FROM orders 
WHERE business_id = 'biz-123' 
  AND placed_at > CURRENT_DATE
ORDER BY placed_at DESC;

-- Row size: 200 bytes
-- 100 orders = 20 KB loaded (50x smaller!)
-- Cache: Efficient
-- Index: Small and fast

-- Get full details only when needed
SELECT o.*, d.*, m.*
FROM orders o
LEFT JOIN order_details d ON d.order_id = o.id
LEFT JOIN order_metadata m ON m.order_id = o.id
WHERE o.id = 'specific-order-id';
```

---

## 🚀 Benefits

### 1. Faster Inserts
- Main table: 200 bytes (vs 10 KB)
- 50x less data to write
- Faster transaction commits

### 2. Efficient Updates
- Update status: Only 200-byte row rewritten
- Less MVCC bloat
- Fewer VACUUM operations needed

### 3. Better Caching
- Hot data stays in cache longer
- 50x more orders fit in same memory
- Fewer disk reads

### 4. Easier Scaling
- Add new features to metadata table
- No impact on hot queries
- Can archive old metadata separately

### 5. Flexible Archiving
```sql
-- Archive old cold data (>1 year)
INSERT INTO order_metadata_archive
SELECT * FROM order_metadata
WHERE created_at < NOW() - INTERVAL '1 year';

DELETE FROM order_metadata
WHERE created_at < NOW() - INTERVAL '1 year';

-- Hot data stays fast!
```

---

## 🔄 Migration Strategy

### Phase 1: Add New Tables (No Downtime)

```sql
-- Create new tables
CREATE TABLE order_details (...);
CREATE TABLE order_metadata (...);

-- Migrate existing data
INSERT INTO order_details (order_id, customer_name, ...)
SELECT id, customer_name, ...
FROM orders;

INSERT INTO order_metadata (order_id, menu_items_snapshot, ...)
SELECT id, menu_items_snapshot, ...
FROM orders;
```

### Phase 2: Update Application Code

```typescript
// Old way
const order = await orderRepository.findOne({ 
  where: { id },
  relations: ['items']
});

// New way (hot data only)
const order = await orderRepository.findOne({ 
  where: { id }
});

// Full details when needed
const orderWithDetails = await orderRepository.findOne({ 
  where: { id },
  relations: ['details', 'metadata', 'items']
});
```

### Phase 3: Remove Old Columns (After Testing)

```sql
-- Drop migrated columns from orders table
ALTER TABLE orders 
  DROP COLUMN customer_name,
  DROP COLUMN customer_phone,
  DROP COLUMN delivery_address_json,
  DROP COLUMN menu_items_snapshot_json;
```

---

## 📊 Real-World Example

### Scenario: 2500 orders/day, 1 million orders/year

#### Single Table Approach
- Row size: 10 KB
- Table size: 10 GB/year
- Status update: 10 KB write
- List query: 1 MB for 100 orders
- Cache efficiency: Low

#### Separated Approach
- Hot table: 200 MB/year (200 bytes × 1M)
- Warm table: 800 MB/year (800 bytes × 1M)
- Cold table: 5 GB/year (5 KB × 1M)
- Status update: 200 bytes write (50x faster!)
- List query: 20 KB for 100 orders (50x less!)
- Cache efficiency: High

**Total savings:**
- 50x faster status updates
- 50x less memory usage
- 50x more orders in cache
- Easy to archive cold data

---

## 🎯 Recommendation

**For your current scale:** Your existing structure is fine.

**When to migrate:**
- 1000+ orders/day
- Frequent status updates causing slowness
- Adding delivery tracking, refunds, analytics
- Table size > 1 GB
- Cache hit rate dropping

**Start with:** Keep current structure, but plan for separation when adding:
- Delivery tracking
- Refund system
- Customer reviews
- Analytics features
- Invoice generation

---

## 📝 Summary

**Hot Data:** Small, frequently accessed, keep in main table  
**Cold Data:** Large, rarely accessed, move to separate tables  

**Benefits:**
- 50x faster queries
- 50x less memory usage
- Easier scaling
- Flexible archiving

**When to apply:** When you hit 1000+ orders/day or add complex features

