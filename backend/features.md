# features.md

## 1. Customer Features

### Authentication

- Register with `firstName`, `lastName`, `username`, `email`, `phoneNumber`, `password`
- Login using `identifier` where identifier is either email or phone number
- Refresh session using refresh token
- Logout current session
- Logout all sessions
- Forgot password
- Reset password
- View profile
- Update profile
- Change password

### Address Book

- List saved addresses
- Create address
- Update address
- Delete address
- Mark default shipping address
- Mark default billing address
- Store GST billing details where applicable

### Birth Profiles

Release note:

- `Birth Profiles` are optional enrichment scope for the astrology domain.
- They are not required for core commerce flows such as catalog, cart, checkout, payment, orders, returns, or admin operations.
- Participants may implement them fully, stub them, or defer them without breaking the core e-commerce build.

- Create birth profile
- List birth profiles
- Update birth profile
- Delete birth profile

### Catalog Browsing

- List categories
- View category detail
- Browse category products
- Search products with MongoDB full-text search in Phase 1
- Filter by category
- Filter by price range
- Filter by attribute values
- Filter by availability
- Filter by featured products
- Sort by newest
- Sort by price low to high
- Sort by price high to low
- Sort by popularity

### Product Detail

- View product detail
- View image gallery
- View available variants/SKUs
- View attribute combinations
- View approved reviews
- View related products
- View recommendations

### Wishlist

- Add product to wishlist
- Remove product from wishlist
- List wishlist items

### Cart

- View active cart
- Add SKU to cart
- Update cart item quantity
- Remove cart item
- Apply one coupon
- Remove coupon
- View backend-calculated totals

### Checkout

- Auth required before checkout
- Preview checkout totals
- Select shipping address
- Select billing address
- Choose payment method
- Place prepaid order
- Place COD order
- Receive inventory hold for 15 minutes on order creation

### Orders

- List orders
- View order detail
- View order timeline
- Download invoice
- Cancel order in `pending` or `confirmed`

### Payments

- Create payment order for Razorpay or Cashfree
- Verify payment callback payload
- View payment status through order detail

### Reviews

- Create review only after verified purchase
- One review per product per user
- Edit own review
- Delete own review
- Upload up to 5 review images
- View review moderation state indirectly through own review details

### Returns

- Create return request within 15 days after delivery
- Return full or partial quantities at item level
- Refund only, no exchange
- Track return status

### Notifications

- Receive order, payment, return, and review notifications by email
- Receive operational notifications by SMS where configured

## 2. Admin Features

### Dashboard

- View orders summary
- View payments summary
- View inventory alerts
- View return queue
- View coupon usage summary

### User Management

- View users
- Block or unblock users
- View user orders, reviews, returns

### Category Management

- Create category
- Update category
- Soft delete category
- Activate or deactivate category
- Manage category SEO fields

### Product Management

- Create product
- Update product content
- Manage product images
- Manage embedded attribute definitions
- Manage embedded SKUs
- Set product status `draft`, `published`, `archived`
- Activate or deactivate product
- Soft delete product
- Manage SEO metadata
- Manage recommendations

### Inventory Management

- View SKU stock
- Adjust stock manually
- View reservation holds
- View inventory transaction ledger
- Track low-stock SKUs

### Order Management

- View order list
- View order detail
- Update order status
- Add admin notes
- Override cancellation rules
- Add shipment details
- Generate or reissue invoice

### Payment Management

- View payment attempts
- View gateway payload logs
- Mark COD collection state through order processing workflows
- Track refunded and partially refunded payments

### Coupon Management

- Create coupon
- Update coupon
- Activate or deactivate coupon
- Configure percentage or fixed discount
- Configure per-user limits
- Configure first-order-only coupons
- Configure category or product restrictions

### Review Moderation

- List pending reviews
- Approve review
- Reject review with reason
- Soft delete review

### Return Management

- View return queue
- Approve or reject return
- Schedule pickup
- Mark item received
- Trigger refund initiation
- Mark refund completed

### Audit and Compliance

- View admin audit logs
- View inventory changes
- View payment status changes
- View order status changes

## 3. Business Flows

### Registration and Login Flow

1. User registers with unique email, phone number, and username.
2. Password is hashed using Argon2id.
3. User logs in using email or phone number as `identifier`.
4. Backend issues 15-minute access token and 30-day refresh token.
5. Refresh token is stored hashed and rotated on refresh.

### Product Discovery Flow

1. User browses categories or searches products.
2. Backend applies filters, sorts, pagination, and only returns published active products.
3. Product detail includes SKU variants, images, approved reviews, and recommendations.

### Cart and Coupon Flow

1. User adds SKU to cart.
2. Backend validates product and SKU status.
3. Backend recalculates cart pricing.
4. User applies at most one coupon.
5. Backend validates coupon scope, date range, user limit, order minimum, and payment-method compatibility.

### Checkout Flow

1. User must be authenticated.
2. User selects shipping and billing addresses.
3. Backend validates India-only delivery.
4. Backend validates stock, coupon, COD rules, and totals.
5. Checkout preview returns final commercial amounts.

### Prepaid Order Flow

1. User places order with `razorpay` or `cashfree`.
2. Backend creates order with `pending`.
3. Backend creates 15-minute inventory reservation.
4. Backend creates payment record.
5. Payment gateway order/session is created.
6. User completes payment.
7. Backend may validate the frontend callback payload through `POST /payments/verify`, but this does not become the final source of truth.
8. Verified payment gateway webhook is the only authoritative event that moves a prepaid order to `confirmed`.
9. Reserved stock is converted into sold stock.
10. Invoice is generated.
11. Notification is sent.

### COD Order Flow

1. User places order with `cod`.
2. Backend validates order total `<= 10000.00`.
3. Backend creates order with `confirmed`.
4. Backend creates inventory reservation and converts it immediately to committed stock inside the same transaction.
5. COD payment document is created with method `cod` and status `pending`.
6. Order continues through fulfillment lifecycle.
7. COD payment is marked `paid` only when admin confirms settlement after delivery or operational reconciliation.

### Payment Failure Flow

1. Payment verification fails or reservation expires.
2. Payment record is updated to `failed` or `cancelled`.
3. Order is cancelled if still unpaid.
4. Inventory reservation is released.
5. Stock hold is removed.
6. User is notified.

### Media Handling Rule

1. File upload APIs are out of scope for this release package.
2. All product image and review image fields accept pre-uploaded public CDN URLs only.
3. Participants may use S3, R2, MinIO, or any compatible object storage outside this contract.

### COD Refund Flow

1. Prepaid orders refund to the original payment source.
2. COD orders do not have an original online payment source.
3. COD return refunds must use customer-provided `upi` or `bank_account` payout details collected during the return workflow or by admin operations.
4. If a team does not implement automated COD payouts, they must still model COD refunds as an explicit manual-admin flow.

### Fulfillment Flow

1. Confirmed order moves to `processing`.
2. Admin packs the order.
3. Shipment details are added.
4. Order moves to `shipped`.
5. Delivery confirmation moves order to `delivered`.

## 4. Order Lifecycle

### Primary order lifecycle

```text
pending
  -> confirmed
  -> cancelled

confirmed
  -> processing
  -> cancelled

processing
  -> packed

packed
  -> shipped

shipped
  -> delivered

delivered
  -> terminal

cancelled
  -> terminal
```

### Cancellation rules

- Customer can cancel only when status is `pending` or `confirmed`
- Admin can override cancellation rules
- Cancellation after shipment is not allowed in customer APIs

## 5. Payment Lifecycle

### Razorpay or Cashfree

```text
pending
  -> payment_link_created
  -> authorized
  -> paid
  -> failed
  -> cancelled

paid
  -> refund_pending
  -> partially_refunded
  -> refunded
```

### COD

```text
pending
  -> paid
  -> cancelled
```

Business notes:

- gateway webhook verification is mandatory
- synchronous verification endpoint may update the order temporarily, but final reconciliation is still gateway-backed
- one successful prepaid payment should settle one order

## 6. Return Lifecycle

```text
requested
  -> approved
  -> rejected

approved
  -> pickup_scheduled

pickup_scheduled
  -> received

received
  -> refund_initiated

refund_initiated
  -> completed
```

Business rules:

- return window: 15 days from `delivered_at`
- refund only, no exchange
- partial item returns supported
- review of physical condition may affect approval
- refunded amount is tracked per returned item

## 7. Frontend and Backend Integration Rules

- Database naming uses `snake_case`
- API naming uses `camelCase`
- Frontend state and payload naming uses `camelCase`
- Database `_id` is exposed as `id` string in API responses
- Backend is the single source of truth for prices, totals, coupon discounts, stock availability, and allowed order transitions
- Frontend must never calculate final payable amount independently
- Frontend should treat all money values as strings
- Frontend should treat all timestamps as UTC strings
- Frontend should not expose hidden admin-only fields
- Product attribute filters must use the API query contract exactly as documented in `api-documentation.md`

## 8. Admin RBAC Matrix

| Role | Dashboard | Catalog | Orders | Inventory | Coupons | Reviews | Returns | Users | Audit Logs |
|------|-----------|---------|--------|-----------|---------|---------|---------|-------|------------|
| `superAdmin` | Full | Full | Full | Full | Full | Full | Full | Full | Full |
| `catalogManager` | Read | Full | Read | Read | Read | Read | Read | No | No |
| `orderManager` | Read | Read | Full | Read | Read | Read | Full | No | Read |
| `supportAgent` | Read | Read | Read | No | No | Read | Read | Read | No |
| `admin` | Treated as project-defined alias and should be mapped to one of the explicit roles above before production use |

## 9. Release Lock and Out of Scope

- Webhook is the only source of truth for prepaid payment settlement.
- Direct binary upload APIs are out of scope.
- Public CDN image URLs are in scope.
- Birth profiles are optional and non-blocking to core commerce.
- Multi-currency is out of scope.
- International shipping is out of scope.
- Multi-vendor inventory is out of scope.

## 10. Missing Items Resolved in Final Scope

- ID strategy finalized as MongoDB `ObjectId`
- database finalized as MongoDB
- guest checkout disallowed
- single vendor and single inventory pool confirmed
- India-only shipping confirmed
- COD enabled with `10000.00` limit
- GST invoice support confirmed
- verified-purchase reviews only
- one coupon per order, no stacking
- 15-minute reservation and 15-day return window confirmed
