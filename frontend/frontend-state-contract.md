# frontend-state-contract.md

## Global Rules

- Every data-fetching page must handle `loading`, `success`, `empty`, and `error`
- Every mutation must handle `idle`, `submitting`, `success`, and `failed`
- FE must use backend `message` and field-level `errors` where available
- FE must not derive order/payment lifecycle beyond server-provided enum values

## API Envelope Contract

### Success

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

### Error

```json
{
  "success": false,
  "message": "Validation Failed",
  "errors": [
    {
      "field": "email",
      "message": "Email already exists"
    }
  ]
}
```

## Page State Rules

### Authentication

- On `401`, clear invalid session and route to login if endpoint requires auth
- Preserve intended route for post-login redirect
- Disable submit while request is in flight
- Show generic login failure, not user enumeration detail beyond allowed API message

### Product Listing

- Keep filter state in URL query params
- Reset page to `1` when filters or sort change
- Show empty state for no products
- Preserve previous grid while loading next page if using client transitions

### Product Detail

- Default selected SKU must be derived from first valid active variant
- Disable add-to-cart until required variant axes are selected
- Show out-of-stock state from backend availability only

### Cart

- Optimistic UI allowed only for quantity input display, but final totals must be replaced by server response
- On coupon failure, keep previous cart state and show backend error
- Remove unavailable items only after explicit backend response

### Checkout

- Checkout page must refetch cart before place-order
- Place-order button must be disabled during submission
- FE must show reservation expiry returned by backend
- COD option must be hidden or disabled if backend preview says invalid

### Orders

- Cancel button visible only when order status is `pending` or `confirmed`
- Return CTA visible only when order status is `delivered` and item is still returnable
- Invoice download visible only when `invoiceUrl` is present

### Reviews

- Review create/edit forms enforce max 5 image URLs or upload slots
- Edited review should return to `pending` moderation state in UI
- Show only approved reviews publicly
- FE must treat review and product image fields as pre-uploaded public URLs only unless the participant adds a custom upload system outside this contract

### Admin

- Route guards required by admin role
- Hide actions not permitted by the release RBAC map
- Status transition controls should be driven by allowed current state
- `superAdmin`: full admin access
- `catalogManager`: categories, products, SEO, recommendations
- `orderManager`: orders, returns, shipments, invoices
- `supportAgent`: read users, read orders, read returns, support-facing review workflows

### Optional Scope

- `Birth Profiles` are optional enrichment scope
- FE teams may omit those pages without blocking core commerce implementation

## Form Validation Expectations

### Common

- Required fields marked before submit
- Server validation errors must map to form fields by `field`
- Unknown server errors shown in a top-level form alert

### Auth

- Email format validation
- E.164 phone validation
- Password strength meter optional, server rules mandatory

### Address

- Country fixed to `India`
- Postal code exactly 6 digits
- GSTIN format validation only when provided

### Review

- Rating integer `1..5`
- Max 5 images

### Checkout

- Shipping address required
- Billing address required
- Payment method required

## Client Storage Rules

- Store access token in the project-approved secure mechanism
- Refresh token handling should follow app security policy; if browser-based, prefer secure cookie strategy if backend supports it
- Never store password, raw payment payloads, or sensitive PII in local logs

## Suggested FE Modules

- `auth`
- `catalog`
- `product`
- `wishlist`
- `cart`
- `checkout`
- `orders`
- `returns`
- `reviews`
- `profile`
- `admin`

## Suggested Error Code Handling

- `400`: malformed request, show generic request error
- `401`: prompt login or refresh session
- `403`: show permission denied state
- `404`: show not found state
- `409`: show business conflict message
- `422`: bind field errors to form
- `500`: show retry message and support fallback
