# db-design.md

## 1. Database Overview

- Database engine: MongoDB
- ID strategy: MongoDB `ObjectId`
- API ID format: stringified `ObjectId`
- Currency: `INR`
- Money storage format: `Decimal128`
- Timestamp format: UTC ISO-8601
- Soft deletes: `deleted_at` for users, products, categories, coupons, reviews
- Transactions required for: orders, payments, inventory reservations/releases, returns, refunds
- Naming convention: `snake_case`

## 2. Global Document Conventions

### Common fields

All top-level collections should include these fields unless explicitly excluded:

```json
{
  "_id": "ObjectId",
  "created_at": "Date",
  "updated_at": "Date",
  "deleted_at": "Date|null"
}
```

### ID Contract

- Database primary key: `ObjectId`
- API response ID: 24-character lowercase hex string
- Foreign keys: stored as `ObjectId`

### Money Contract

- MongoDB type: `Decimal128`
- API type: string with 2 decimal places
- Examples: `"0.00"`, `"7999.00"`, `"15498.50"`

### Date Contract

- MongoDB type: `Date`
- API type: ISO-8601 UTC string
- Example: `"2026-06-16T10:00:00Z"`

## 3. Enums

### user_role

- `customer`
- `admin`
- `super_admin`
- `catalog_manager`
- `order_manager`
- `support_agent`

### user_status

- `active`
- `blocked`
- `pending_verification`

### address_type

- `home`
- `work`
- `other`

### product_status

- `draft`
- `published`
- `archived`

### product_attribute_type

- `text`
- `number`
- `select`

### cart_status

- `active`
- `converted`
- `abandoned`

### order_status

- `pending`
- `confirmed`
- `processing`
- `packed`
- `shipped`
- `delivered`
- `cancelled`

### payment_method

- `razorpay`
- `cashfree`
- `cod`

### payment_status

- `pending`
- `payment_link_created`
- `authorized`
- `paid`
- `failed`
- `cancelled`
- `refund_pending`
- `refunded`
- `partially_refunded`

### inventory_reservation_status

- `active`
- `converted`
- `released`
- `expired`

### inventory_transaction_type

- `opening_stock`
- `manual_adjustment`
- `reservation_hold`
- `reservation_release`
- `order_confirmed`
- `order_cancelled`
- `return_received`
- `return_restocked`

### coupon_discount_type

- `percentage`
- `fixed`

### coupon_status

- `active`
- `inactive`
- `expired`

### review_status

- `pending`
- `approved`
- `rejected`

### return_status

- `requested`
- `approved`
- `pickup_scheduled`
- `received`
- `refund_initiated`
- `completed`
- `rejected`

### notification_channel

- `email`
- `sms`

### notification_status

- `queued`
- `sent`
- `failed`

## 4. Collections

## 4.1 `users`

Purpose: customer and admin accounts with role-based access.

```json
{
  "_id": "ObjectId",
  "role": "customer",
  "status": "active",
  "first_name": "Vishnu",
  "last_name": "Sharma",
  "full_name": "Vishnu Sharma",
  "username": "vishnu123",
  "email": "vishnu@example.com",
  "email_verified_at": "Date|null",
  "phone_number": "+919876543210",
  "phone_verified_at": "Date|null",
  "password_hash": "argon2id_hash",
  "avatar_url": "https://cdn.example.com/users/1/avatar.jpg",
  "last_login_at": "Date|null",
  "is_marketing_opt_in": false,
  "created_at": "Date",
  "updated_at": "Date",
  "deleted_at": "Date|null"
}
```

Constraints:

- `email` unique, case-insensitive
- `phone_number` unique
- `username` unique, nullable for admin-created users only if business permits
- `password_hash` never exposed in APIs

Indexes:

- unique: `{ email: 1 }`
- unique: `{ phone_number: 1 }`
- unique: `{ username: 1 }`
- index: `{ role: 1, status: 1 }`
- index: `{ created_at: -1 }`

## 4.2 `refresh_tokens`

Purpose: refresh token rotation, revocation, device/session management.

```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "token_hash": "sha256_hash",
  "device_id": "web-chrome-mac",
  "ip_address": "203.0.113.10",
  "user_agent": "Mozilla/5.0 ...",
  "expires_at": "Date",
  "revoked_at": "Date|null",
  "created_at": "Date",
  "updated_at": "Date"
}
```

Constraints:

- store hash only, never raw refresh token
- token invalid after rotation or logout

Indexes:

- unique: `{ token_hash: 1 }`
- index: `{ user_id: 1, expires_at: 1 }`
- TTL-like cleanup job on `expires_at`

## 4.3 `password_reset_tokens`

Purpose: password reset flow.

```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "token_hash": "sha256_hash",
  "expires_at": "Date",
  "used_at": "Date|null",
  "created_at": "Date"
}
```

Indexes:

- unique: `{ token_hash: 1 }`
- index: `{ user_id: 1, created_at: -1 }`

## 4.4 `user_addresses`

Purpose: saved address book for customer checkout.

```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "type": "home",
  "title": "Home",
  "full_name": "Vishnu Sharma",
  "phone_number": "+919876543210",
  "address_line_1": "Sector 62",
  "address_line_2": "Near Metro Station",
  "landmark": "Opposite Mall",
  "city": "Noida",
  "state": "Uttar Pradesh",
  "country": "India",
  "postal_code": "201309",
  "is_default_shipping": true,
  "is_default_billing": false,
  "gstin": null,
  "company_name": null,
  "created_at": "Date",
  "updated_at": "Date",
  "deleted_at": "Date|null"
}
```

Constraints:

- India-only addresses in Phase 1
- one active default shipping address per user
- one active default billing address per user

Indexes:

- index: `{ user_id: 1, deleted_at: 1 }`
- index: `{ user_id: 1, is_default_shipping: 1 }`
- index: `{ user_id: 1, is_default_billing: 1 }`
- index: `{ postal_code: 1 }`

## 4.5 `birth_profiles`

Purpose: optional astrology-specific saved profiles for personalization or assisted product selection.

```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "full_name": "Vishnu Sharma",
  "date_of_birth": "Date",
  "time_of_birth": "10:35:00",
  "place_of_birth": "Delhi, India",
  "notes": null,
  "created_at": "Date",
  "updated_at": "Date",
  "deleted_at": "Date|null"
}
```

Indexes:

- index: `{ user_id: 1, created_at: -1 }`

## 4.6 `categories`

Purpose: top-level product grouping.

```json
{
  "_id": "ObjectId",
  "name": "Gemstones",
  "slug": "gemstones",
  "description": "Natural astrology gemstones",
  "image_url": "https://cdn.example.com/categories/gemstones.jpg",
  "sort_order": 1,
  "is_featured": true,
  "is_active": true,
  "seo": {
    "meta_title": "Gemstones",
    "meta_description": "Natural astrology gemstones",
    "canonical_url": "/categories/gemstones",
    "og_image_url": "https://cdn.example.com/categories/gemstones-og.jpg"
  },
  "created_at": "Date",
  "updated_at": "Date",
  "deleted_at": "Date|null"
}
```

Constraints:

- `slug` unique among non-deleted categories

Indexes:

- unique: `{ slug: 1 }`
- index: `{ is_active: 1, sort_order: 1 }`

## 4.7 `products`

Purpose: canonical product catalog with embedded media, configurable attributes, and embedded SKU documents.

```json
{
  "_id": "ObjectId",
  "category_id": "ObjectId",
  "sub_category_id": "ObjectId|null",
  "name": "Natural Ruby Ring",
  "slug": "natural-ruby-ring",
  "short_description": "Certified natural ruby ring",
  "description": "Premium certified ruby ring for astrology purposes.",
  "status": "published",
  "is_active": true,
  "is_featured": true,
  "brand_name": null,
  "tags": ["ruby", "ring", "astrology"],
  "search_keywords": ["natural ruby ring", "ruby gemstone ring"],
  "cover_image_url": "https://cdn.example.com/products/ruby-cover.jpg",
  "images": [
    {
      "_id": "ObjectId",
      "image_url": "https://cdn.example.com/products/ruby-side.jpg",
      "alt_text": "Ruby ring side view",
      "display_order": 1
    }
  ],
  "attribute_definitions": [
    {
      "code": "carat",
      "label": "Carat",
      "type": "number",
      "is_required": true,
      "is_filterable": true,
      "is_variant_axis": true,
      "options": []
    },
    {
      "code": "metal",
      "label": "Metal",
      "type": "select",
      "is_required": true,
      "is_filterable": true,
      "is_variant_axis": true,
      "options": ["gold", "silver"]
    }
  ],
  "skus": [
    {
      "_id": "ObjectId",
      "sku_code": "RUBY-RING-5.25-GOLD",
      "variant_name": "5.25 Carat / Gold",
      "attribute_values": [
        { "code": "carat", "value": "5.25" },
        { "code": "metal", "value": "gold" }
      ],
      "price": "Decimal128",
      "compare_at_price": "Decimal128|null",
      "cost_price": "Decimal128|null",
      "available_quantity": 25,
      "reserved_quantity": 0,
      "low_stock_threshold": 5,
      "weight_grams": "Decimal128|null",
      "hsn_code": "7103",
      "is_active": true
    }
  ],
  "seo": {
    "meta_title": "Natural Ruby Ring | Astrology Gemstone",
    "meta_description": "Buy certified ruby ring for astrology purposes.",
    "canonical_url": "/products/natural-ruby-ring",
    "og_title": "Natural Ruby Ring",
    "og_description": "Premium certified ruby ring",
    "og_image_url": "https://cdn.example.com/products/ruby-cover.jpg"
  },
  "search_vector_text": "Natural Ruby Ring Certified natural ruby ring ruby ring astrology",
  "created_at": "Date",
  "updated_at": "Date",
  "deleted_at": "Date|null"
}
```

Constraints:

- `slug` unique among non-deleted products
- `skus._id` unique within product
- `skus.sku_code` globally unique
- `available_quantity >= 0`
- `reserved_quantity >= 0`
- `reserved_quantity <= available_quantity`

Indexes:

- unique: `{ slug: 1 }`
- unique: `{ "skus.sku_code": 1 }`
- index: `{ category_id: 1, is_active: 1, status: 1 }`
- index: `{ is_featured: 1, is_active: 1 }`
- index: `{ tags: 1 }`
- text index: `{ name: "text", short_description: "text", description: "text", search_keywords: "text" }`
- index: `{ "skus.price": 1 }`

## 4.8 `wishlists`

Purpose: user product bookmarks.

```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "product_id": "ObjectId",
  "created_at": "Date"
}
```

Constraints:

- one wishlist record per user/product

Indexes:

- unique: `{ user_id: 1, product_id: 1 }`
- index: `{ user_id: 1, created_at: -1 }`

## 4.9 `carts`

Purpose: active customer cart with embedded items.

```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "status": "active",
  "coupon_code": "WELCOME10",
  "coupon_snapshot": {
    "coupon_id": "ObjectId",
    "code": "WELCOME10",
    "discount_type": "percentage",
    "discount_value": "Decimal128"
  },
  "pricing": {
    "sub_total": "Decimal128",
    "discount_total": "Decimal128",
    "shipping_fee": "Decimal128",
    "cod_fee": "Decimal128",
    "tax_total": "Decimal128",
    "grand_total": "Decimal128"
  },
  "items": [
    {
      "_id": "ObjectId",
      "product_id": "ObjectId",
      "product_sku_id": "ObjectId",
      "product_name": "Natural Ruby Ring",
      "sku_code": "RUBY-RING-5.25-GOLD",
      "variant_name": "5.25 Carat / Gold",
      "cover_image_url": "https://cdn.example.com/products/ruby-cover.jpg",
      "quantity": 2,
      "unit_price": "Decimal128",
      "line_total": "Decimal128",
      "is_available": true
    }
  ],
  "created_at": "Date",
  "updated_at": "Date"
}
```

Constraints:

- one active cart per user
- cart pricing always recomputed by backend

Indexes:

- unique: `{ user_id: 1, status: 1 }`
- index: `{ updated_at: -1 }`

## 4.10 `coupons`

Purpose: one-coupon-per-order discount engine.

```json
{
  "_id": "ObjectId",
  "code": "WELCOME10",
  "name": "Welcome Offer",
  "description": "10% off on first order",
  "status": "active",
  "discount_type": "percentage",
  "discount_value": "Decimal128",
  "minimum_order_amount": "Decimal128",
  "maximum_discount_amount": "Decimal128|null",
  "usage_limit": 1000,
  "used_count": 150,
  "per_user_limit": 1,
  "is_first_order_only": true,
  "allowed_payment_methods": ["razorpay", "cashfree", "cod"],
  "category_ids": ["ObjectId"],
  "product_ids": ["ObjectId"],
  "starts_at": "Date",
  "ends_at": "Date",
  "is_active": true,
  "created_at": "Date",
  "updated_at": "Date",
  "deleted_at": "Date|null"
}
```

Constraints:

- `code` unique, uppercase canonical form
- one coupon per order
- no stacking

Indexes:

- unique: `{ code: 1 }`
- index: `{ is_active: 1, starts_at: 1, ends_at: 1 }`

## 4.11 `coupon_usages`

Purpose: enforce per-user coupon usage tracking.

```json
{
  "_id": "ObjectId",
  "coupon_id": "ObjectId",
  "user_id": "ObjectId",
  "order_id": "ObjectId",
  "used_at": "Date"
}
```

Indexes:

- index: `{ coupon_id: 1, user_id: 1 }`
- index: `{ order_id: 1 }`

## 4.12 `orders`

Purpose: source of truth for commercial order lifecycle with embedded item and address snapshots.

```json
{
  "_id": "ObjectId",
  "order_number": "ORD-20260616-0001",
  "user_id": "ObjectId",
  "status": "pending",
  "payment_method": "razorpay",
  "currency": "INR",
  "pricing": {
    "sub_total": "Decimal128",
    "discount_total": "Decimal128",
    "shipping_fee": "Decimal128",
    "cod_fee": "Decimal128",
    "tax_total": "Decimal128",
    "grand_total": "Decimal128",
    "refunded_total": "Decimal128"
  },
  "coupon_snapshot": {
    "coupon_id": "ObjectId|null",
    "code": "WELCOME10",
    "discount_type": "percentage",
    "discount_value": "Decimal128",
    "discount_amount": "Decimal128"
  },
  "shipping_address": {
    "full_name": "Vishnu Sharma",
    "phone_number": "+919876543210",
    "address_line_1": "Sector 62",
    "address_line_2": "Near Metro Station",
    "landmark": "Opposite Mall",
    "city": "Noida",
    "state": "Uttar Pradesh",
    "country": "India",
    "postal_code": "201309"
  },
  "billing_address": {
    "full_name": "Vishnu Sharma",
    "phone_number": "+919876543210",
    "address_line_1": "Sector 62",
    "address_line_2": "Near Metro Station",
    "landmark": "Opposite Mall",
    "city": "Noida",
    "state": "Uttar Pradesh",
    "country": "India",
    "postal_code": "201309",
    "company_name": "Vishnu Gems Pvt Ltd",
    "gstin": "09ABCDE1234F1Z5"
  },
  "invoice": {
    "invoice_number": "INV-20260616-0001",
    "invoice_url": "https://cdn.example.com/invoices/INV-20260616-0001.pdf",
    "issued_at": "Date|null"
  },
  "items": [
    {
      "_id": "ObjectId",
      "product_id": "ObjectId",
      "product_sku_id": "ObjectId",
      "product_name": "Natural Ruby Ring",
      "sku_code": "RUBY-RING-5.25-GOLD",
      "variant_name": "5.25 Carat / Gold",
      "cover_image_url": "https://cdn.example.com/products/ruby-cover.jpg",
      "hsn_code": "7103",
      "quantity": 2,
      "unit_price": "Decimal128",
      "line_total": "Decimal128",
      "returnable_until": "Date"
    }
  ],
  "reservation": {
    "reservation_id": "ObjectId",
    "expires_at": "Date",
    "released_at": "Date|null",
    "converted_at": "Date|null"
  },
  "shipment": {
    "courier_name": null,
    "tracking_number": null,
    "awb_number": null,
    "tracking_url": null
  },
  "notes": {
    "customer_note": null,
    "admin_note": null
  },
  "placed_at": "Date",
  "confirmed_at": "Date|null",
  "processing_at": "Date|null",
  "packed_at": "Date|null",
  "shipped_at": "Date|null",
  "delivered_at": "Date|null",
  "cancelled_at": "Date|null",
  "created_at": "Date",
  "updated_at": "Date"
}
```

Constraints:

- `order_number` unique
- user cancellation allowed only in `pending` and `confirmed`
- COD order total must be `<= 10000.00`
- one reservation per pending order

Indexes:

- unique: `{ order_number: 1 }`
- index: `{ user_id: 1, created_at: -1 }`
- index: `{ status: 1, created_at: -1 }`
- index: `{ "reservation.expires_at": 1 }`
- index: `{ "shipment.tracking_number": 1 }`

## 4.13 `order_status_history`

Purpose: immutable order timeline.

```json
{
  "_id": "ObjectId",
  "order_id": "ObjectId",
  "old_status": "pending",
  "new_status": "confirmed",
  "changed_by_user_id": "ObjectId|null",
  "changed_by_role": "customer",
  "remarks": "Payment verified",
  "created_at": "Date"
}
```

Indexes:

- index: `{ order_id: 1, created_at: 1 }`

## 4.14 `inventory_reservations`

Purpose: hold sellable stock for 15 minutes after order creation.

```json
{
  "_id": "ObjectId",
  "order_id": "ObjectId",
  "user_id": "ObjectId",
  "status": "active",
  "expires_at": "Date",
  "converted_at": "Date|null",
  "released_at": "Date|null",
  "items": [
    {
      "product_id": "ObjectId",
      "product_sku_id": "ObjectId",
      "quantity": 2
    }
  ],
  "created_at": "Date",
  "updated_at": "Date"
}
```

Constraints:

- reservation expiry: 15 minutes from order creation
- active reservation must match order items exactly

Indexes:

- index: `{ order_id: 1 }`
- index: `{ status: 1, expires_at: 1 }`

## 4.15 `inventory_transactions`

Purpose: append-only stock movement ledger.

```json
{
  "_id": "ObjectId",
  "product_id": "ObjectId",
  "product_sku_id": "ObjectId",
  "transaction_type": "reservation_hold",
  "quantity_delta": -2,
  "reference_type": "order",
  "reference_id": "ObjectId",
  "remarks": "Reserved on order creation",
  "created_by_user_id": "ObjectId|null",
  "created_at": "Date"
}
```

Constraints:

- append-only, no updates

Indexes:

- index: `{ product_sku_id: 1, created_at: -1 }`
- index: `{ reference_type: 1, reference_id: 1 }`

## 4.16 `payments`

Purpose: payment attempts, gateway state, COD state, refunds.

```json
{
  "_id": "ObjectId",
  "order_id": "ObjectId",
  "user_id": "ObjectId",
  "payment_method": "razorpay",
  "provider_order_id": "order_xxx",
  "provider_payment_id": "pay_xxx",
  "provider_reference_id": null,
  "status": "pending",
  "amount": "Decimal128",
  "currency": "INR",
  "is_cod": false,
  "gateway_payload": {},
  "gateway_signature": null,
  "failure_code": null,
  "failure_message": null,
  "paid_at": "Date|null",
  "refunded_at": "Date|null",
  "created_at": "Date",
  "updated_at": "Date"
}
```

Constraints:

- one successful payment per order for prepaid flows
- COD payment document created with `is_cod = true`
- webhook signature verification mandatory

Indexes:

- index: `{ order_id: 1, created_at: -1 }`
- index: `{ status: 1, created_at: -1 }`
- unique sparse: `{ provider_payment_id: 1 }`

## 4.17 `payment_webhook_events`

Purpose: idempotent webhook audit and replay protection.

```json
{
  "_id": "ObjectId",
  "provider": "razorpay",
  "event_id": "evt_123",
  "event_type": "payment.captured",
  "signature_valid": true,
  "payload": {},
  "processed_at": "Date|null",
  "processing_status": "processed",
  "created_at": "Date"
}
```

Indexes:

- unique: `{ provider: 1, event_id: 1 }`

## 4.18 `reviews`

Purpose: verified-purchase-only product reviews with moderation.

```json
{
  "_id": "ObjectId",
  "product_id": "ObjectId",
  "order_id": "ObjectId",
  "user_id": "ObjectId",
  "rating": 5,
  "title": "Excellent",
  "review": "Authentic gemstone",
  "status": "pending",
  "is_verified_purchase": true,
  "images": [
    {
      "_id": "ObjectId",
      "image_url": "https://cdn.example.com/reviews/review-1.jpg"
    }
  ],
  "approved_at": "Date|null",
  "rejected_at": "Date|null",
  "rejection_reason": null,
  "created_at": "Date",
  "updated_at": "Date",
  "deleted_at": "Date|null"
}
```

Constraints:

- one active review per `user_id + product_id`
- rating range `1..5`
- max 5 images
- only verified purchasers can create review

Indexes:

- unique: `{ user_id: 1, product_id: 1 }`
- index: `{ product_id: 1, status: 1, created_at: -1 }`
- index: `{ user_id: 1, created_at: -1 }`

## 4.19 `returns`

Purpose: item-level return and refund lifecycle.

```json
{
  "_id": "ObjectId",
  "return_number": "RET-20260620-0001",
  "order_id": "ObjectId",
  "user_id": "ObjectId",
  "status": "requested",
  "reason": "damaged_product",
  "description": "Stone was cracked on delivery",
  "items": [
    {
      "_id": "ObjectId",
      "order_item_id": "ObjectId",
      "product_id": "ObjectId",
      "product_sku_id": "ObjectId",
      "quantity": 1,
      "unit_price": "Decimal128",
      "refund_amount": "Decimal128"
    }
  ],
  "pickup": {
    "scheduled_at": "Date|null",
    "courier_name": null,
    "tracking_number": null
  },
  "refund": {
    "payment_id": "ObjectId|null",
    "refund_method": "original_source|upi|bank_account|manual_admin",
    "refund_status": "pending",
    "refund_amount": "Decimal128",
    "refund_reference": null,
    "initiated_at": "Date|null",
    "completed_at": "Date|null"
  },
  "requested_at": "Date",
  "approved_at": "Date|null",
  "received_at": "Date|null",
  "completed_at": "Date|null",
  "created_at": "Date",
  "updated_at": "Date"
}
```

Constraints:

- return request allowed only within 15 days of delivery
- refund only, no exchange
- partial item returns allowed
- prepaid refunds use `original_source`
- COD refunds use `upi`, `bank_account`, or `manual_admin`

Indexes:

- unique: `{ return_number: 1 }`
- index: `{ order_id: 1 }`
- index: `{ user_id: 1, created_at: -1 }`
- index: `{ status: 1, created_at: -1 }`

## 4.20 `product_recommendations`

Purpose: static or rule-managed related products.

```json
{
  "_id": "ObjectId",
  "product_id": "ObjectId",
  "recommended_product_id": "ObjectId",
  "score": "Decimal128",
  "source": "manual",
  "created_at": "Date",
  "updated_at": "Date"
}
```

Constraints:

- no self-recommendation
- unique pair per product/recommended product

Indexes:

- unique: `{ product_id: 1, recommended_product_id: 1 }`
- index: `{ product_id: 1, score: -1 }`

## 4.21 `notifications`

Purpose: async outbound communication owned by backend.

```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "channel": "email",
  "template_code": "order_confirmed",
  "recipient": "vishnu@example.com",
  "payload": {},
  "status": "queued",
  "sent_at": "Date|null",
  "failure_reason": null,
  "created_at": "Date",
  "updated_at": "Date"
}
```

Indexes:

- index: `{ status: 1, created_at: 1 }`
- index: `{ user_id: 1, created_at: -1 }`

## 4.22 `admin_audit_logs`

Purpose: immutable admin action journal.

```json
{
  "_id": "ObjectId",
  "admin_user_id": "ObjectId",
  "action": "order_status_updated",
  "entity_type": "order",
  "entity_id": "ObjectId",
  "old_value": {},
  "new_value": {},
  "ip_address": "203.0.113.10",
  "user_agent": "Mozilla/5.0 ...",
  "created_at": "Date"
}
```

Indexes:

- index: `{ admin_user_id: 1, created_at: -1 }`
- index: `{ entity_type: 1, entity_id: 1, created_at: -1 }`

## 5. Relationships

- `users` 1:N `user_addresses`
- `users` 1:N `birth_profiles`
- `users` 1:N `orders`
- `users` 1:N `payments`
- `users` 1:N `reviews`
- `users` 1:N `returns`
- `categories` 1:N `products`
- `products` embeds N `images`
- `products` embeds N `attribute_definitions`
- `products` embeds N `skus`
- `users` 1:1 active `carts`
- `orders` 1:1 `inventory_reservations`
- `orders` 1:N `payments`
- `orders` 1:N `order_status_history`
- `orders` 1:N `returns`
- `coupons` 1:N `coupon_usages`

## 6. Operational Rules

### Order creation transaction

Perform in one MongoDB transaction:

1. Validate user, addresses, cart, coupon, stock
2. Create `orders` document with `pending` status
3. Create `inventory_reservations`
4. Update embedded `reserved_quantity` in product SKU records
5. Insert `inventory_transactions` with `reservation_hold`
6. If coupon used, reserve usage logically at order level

### Payment success transaction

Perform in one MongoDB transaction:

1. Update `payments.status` to `paid`
2. Update `orders.status` to `confirmed`
3. Mark reservation `converted`
4. Reduce SKU `available_quantity`
5. Reduce SKU `reserved_quantity`
6. Insert `inventory_transactions` with `order_confirmed`
7. Insert `order_status_history`

Note:

- For prepaid methods, only a verified gateway webhook should trigger the final `paid` transition and this transaction.

### Payment failure / timeout transaction

Perform in one MongoDB transaction:

1. Mark payment failed or expired
2. Mark order cancelled if unpaid and expired
3. Release reservation
4. Reduce SKU `reserved_quantity`
5. Insert `inventory_transactions` with `reservation_release`
6. Insert `order_status_history`

### Return completion transaction

Perform in one MongoDB transaction:

1. Update return status
2. Update payment refund fields
3. Update order refunded totals
4. Restock SKU if item is resellable
5. Insert `inventory_transactions` with `return_received` and optional `return_restocked`

Note:

- COD refunds must persist payout method details and payout reference before the return is marked fully completed.

## 7. Validation Rules

- `email` valid RFC-style email format
- `phone_number` E.164 format
- `postal_code` 6-digit Indian PIN code
- `gstin` 15-character GSTIN format when present
- `rating` integer `1..5`
- all quantities positive integers
- all monetary values non-negative except internal ledger deltas
- all status transitions must follow allowed lifecycle
- cart and order totals must be computed on server only
- soft-deleted products/categories/coupons must not appear in customer APIs

## 8. Recommended Index Review Checklist

- validate product list filters with compound indexes after traffic data is available
- monitor text search performance before Phase 2 Meilisearch migration
- review `orders.status + created_at` and `payments.status + created_at` indexes for admin dashboards
- ensure webhook event uniqueness prevents replay processing
