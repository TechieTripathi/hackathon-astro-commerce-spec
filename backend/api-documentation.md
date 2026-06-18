# api-documentation.md

## 1. API Overview

- Base URL: `/api/v1`
- Authentication: Bearer JWT
- Access token TTL: 15 minutes
- Refresh token TTL: 30 days
- Content type: `application/json`
- Database source of truth: MongoDB

## 2. Frontend/Backend Contract Rules

- Database naming = `snake_case`
- API naming = `camelCase`
- Frontend naming = `camelCase`
- MongoDB `_id` is returned as `id`
- UUID is not used in this system
- ID format = MongoDB `ObjectId` string, 24 lowercase hexadecimal characters
- Date format = UTC ISO-8601 string, example: `"2026-06-16T10:00:00Z"`
- Money format = string with 2 decimal places, example: `"7999.00"`
- Product and review image fields accept pre-uploaded public CDN URLs only
- Direct file upload and presigned-upload APIs are out of scope for this release
- For prepaid methods, verified payment gateway webhook is the only source of truth that can finalize payment as `paid` and advance order state to `confirmed`
- Pagination format:

```json
{
  "page": 1,
  "limit": 20,
  "total": 500,
  "totalPages": 25,
  "items": []
}
```

### Standard success response

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

### Standard error response

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

### Enum definitions

```json
{
  "userRole": ["customer", "admin", "superAdmin", "catalogManager", "orderManager", "supportAgent"],
  "productStatus": ["draft", "published", "archived"],
  "orderStatus": ["pending", "confirmed", "processing", "packed", "shipped", "delivered", "cancelled"],
  "paymentMethod": ["razorpay", "cashfree", "cod"],
  "paymentStatus": ["pending", "paymentLinkCreated", "authorized", "paid", "failed", "cancelled", "refundPending", "partiallyRefunded", "refunded"],
  "reviewStatus": ["pending", "approved", "rejected"],
  "returnStatus": ["requested", "approved", "pickupScheduled", "received", "refundInitiated", "completed", "rejected"]
}
```

### Admin RBAC contract

| Role | Allowed Areas |
|------|---------------|
| `superAdmin` | all admin modules |
| `catalogManager` | categories, products, product SEO, recommendations |
| `orderManager` | orders, returns, invoice operations, shipment operations |
| `supportAgent` | read users, read orders, read returns, review support flows |
| `admin` | compatibility alias only; map to one explicit role before production use |

## 3. Authentication Module

### Endpoint

`POST /api/v1/auth/register`

Method: `POST`  
Auth Required: `No`

Request Payload:

```json
{
  "firstName": "Vishnu",
  "lastName": "Sharma",
  "username": "vishnu123",
  "email": "vishnu@example.com",
  "phoneNumber": "+919876543210",
  "password": "Password@123"
}
```

Success Response:

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "userId": "665c8f9f8c3c2d7f9b8a1234"
  }
}
```

Error Response:

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

Status Codes:

- `201`
- `400`
- `409`
- `422`
- `500`

Validation Rules:

- `firstName`: required, 1-50 chars
- `lastName`: required, 1-50 chars
- `username`: required, 3-30 chars, unique, alphanumeric plus underscore
- `email`: required, valid, unique
- `phoneNumber`: required, E.164, unique
- `password`: required, 8-64 chars, uppercase, lowercase, number, special character

### Endpoint

`POST /api/v1/auth/login`

Method: `POST`  
Auth Required: `No`

Request Payload:

```json
{
  "identifier": "vishnu@example.com",
  "password": "Password@123"
}
```

Success Response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "jwt_access_token",
    "refreshToken": "refresh_token",
    "user": {
      "id": "665c8f9f8c3c2d7f9b8a1234",
      "firstName": "Vishnu",
      "lastName": "Sharma",
      "email": "vishnu@example.com",
      "phoneNumber": "+919876543210",
      "role": "customer"
    }
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Invalid credentials",
  "errors": [
    {
      "field": "identifier",
      "message": "Email or phone number not found"
    }
  ]
}
```

Status Codes:

- `200`
- `400`
- `401`
- `422`
- `500`

Validation Rules:

- `identifier`: required, email or E.164 phone number
- `password`: required
- rate limiting required

### Endpoint

`POST /api/v1/auth/refresh-token`

Method: `POST`  
Auth Required: `No`

Request Payload:

```json
{
  "refreshToken": "refresh_token"
}
```

Success Response:

```json
{
  "success": true,
  "message": "Token refreshed",
  "data": {
    "accessToken": "new_access_token",
    "refreshToken": "new_refresh_token"
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Refresh token invalid",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `500`

Validation Rules:

- `refreshToken`: required
- refresh token rotation mandatory

### Endpoint

`POST /api/v1/auth/logout`

Method: `POST`  
Auth Required: `Yes`

Request Payload:

```json
{
  "refreshToken": "refresh_token"
}
```

Success Response:

```json
{
  "success": true,
  "message": "Logout successful",
  "data": {}
}
```

Error Response:

```json
{
  "success": false,
  "message": "Unauthorized",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `500`

Validation Rules:

- revoke provided refresh token if present

### Endpoint

`POST /api/v1/auth/forgot-password`

Method: `POST`  
Auth Required: `No`

Request Payload:

```json
{
  "email": "vishnu@example.com"
}
```

Success Response:

```json
{
  "success": true,
  "message": "If the email exists, reset instructions have been sent",
  "data": {}
}
```

Error Response:

```json
{
  "success": false,
  "message": "Validation Failed",
  "errors": []
}
```

Status Codes:

- `200`
- `400`
- `422`
- `500`

Validation Rules:

- `email`: required, valid

### Endpoint

`POST /api/v1/auth/reset-password`

Method: `POST`  
Auth Required: `No`

Request Payload:

```json
{
  "token": "reset_token",
  "password": "NewPassword@123"
}
```

Success Response:

```json
{
  "success": true,
  "message": "Password reset successful",
  "data": {}
}
```

Error Response:

```json
{
  "success": false,
  "message": "Reset token invalid or expired",
  "errors": []
}
```

Status Codes:

- `200`
- `400`
- `401`
- `422`
- `500`

Validation Rules:

- `token`: required
- `password`: required, same complexity as registration

## 4. User Profile Module

### Endpoint

`GET /api/v1/users/profile`

Method: `GET`  
Auth Required: `Yes`

Request Payload:

```json
{}
```

Success Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "665c8f9f8c3c2d7f9b8a1234",
    "firstName": "Vishnu",
    "lastName": "Sharma",
    "username": "vishnu123",
    "email": "vishnu@example.com",
    "phoneNumber": "+919876543210",
    "avatarUrl": "https://cdn.example.com/users/avatar.jpg",
    "role": "customer",
    "createdAt": "2026-06-16T10:00:00Z",
    "updatedAt": "2026-06-16T10:00:00Z"
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Unauthorized",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `500`

Validation Rules:

- authenticated customer or admin only

### Endpoint

`PUT /api/v1/users/profile`

Method: `PUT`  
Auth Required: `Yes`

Request Payload:

```json
{
  "firstName": "Vishnu",
  "lastName": "Sharma",
  "username": "vishnu123",
  "phoneNumber": "+919876543210",
  "avatarUrl": "https://cdn.example.com/users/avatar.jpg"
}
```

Success Response:

```json
{
  "success": true,
  "message": "Profile updated",
  "data": {
    "id": "665c8f9f8c3c2d7f9b8a1234"
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Validation Failed",
  "errors": [
    {
      "field": "username",
      "message": "Username already exists"
    }
  ]
}
```

Status Codes:

- `200`
- `400`
- `401`
- `409`
- `422`
- `500`

Validation Rules:

- `username`: optional, unique if changed
- `phoneNumber`: optional, unique if changed

## 5. Address Module

### Endpoint

`GET /api/v1/users/addresses`

Method: `GET`  
Auth Required: `Yes`

Request Payload:

```json
{}
```

Success Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "items": [
      {
        "id": "665c901f8c3c2d7f9b8a1240",
        "type": "home",
        "title": "Home",
        "fullName": "Vishnu Sharma",
        "phoneNumber": "+919876543210",
        "addressLine1": "Sector 62",
        "addressLine2": "Near Metro Station",
        "city": "Noida",
        "state": "Uttar Pradesh",
        "country": "India",
        "postalCode": "201309",
        "isDefaultShipping": true,
        "isDefaultBilling": false
      }
    ]
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Unauthorized",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `500`

Validation Rules:

- user sees only own addresses

### Endpoint

`POST /api/v1/users/addresses`

Method: `POST`  
Auth Required: `Yes`

Request Payload:

```json
{
  "type": "home",
  "title": "Home",
  "fullName": "Vishnu Sharma",
  "phoneNumber": "+919876543210",
  "addressLine1": "Sector 62",
  "addressLine2": "Near Metro Station",
  "landmark": "Opposite Mall",
  "city": "Noida",
  "state": "Uttar Pradesh",
  "country": "India",
  "postalCode": "201309",
  "isDefaultShipping": true,
  "isDefaultBilling": false,
  "gstin": "09ABCDE1234F1Z5",
  "companyName": "Vishnu Gems Pvt Ltd"
}
```

Success Response:

```json
{
  "success": true,
  "message": "Address created",
  "data": {
    "id": "665c901f8c3c2d7f9b8a1240"
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Validation Failed",
  "errors": [
    {
      "field": "postalCode",
      "message": "Only Indian PIN codes are supported"
    }
  ]
}
```

Status Codes:

- `201`
- `400`
- `401`
- `422`
- `500`

Validation Rules:

- `country`: must be `India`
- `postalCode`: required, 6 digits
- `gstin`: optional, valid GSTIN if present

### Endpoint

`PUT /api/v1/users/addresses/{addressId}`

Method: `PUT`  
Auth Required: `Yes`

Request Payload:

```json
{
  "title": "Office",
  "fullName": "Vishnu Sharma",
  "phoneNumber": "+919876543210",
  "addressLine1": "Sector 18",
  "addressLine2": "Tower A",
  "landmark": "Near Metro",
  "city": "Noida",
  "state": "Uttar Pradesh",
  "country": "India",
  "postalCode": "201301",
  "isDefaultShipping": false,
  "isDefaultBilling": true,
  "gstin": null,
  "companyName": null
}
```

Success Response:

```json
{
  "success": true,
  "message": "Address updated",
  "data": {}
}
```

Error Response:

```json
{
  "success": false,
  "message": "Address not found",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `404`
- `422`
- `500`

Validation Rules:

- `addressId`: valid ObjectId
- address must belong to authenticated user

### Endpoint

`DELETE /api/v1/users/addresses/{addressId}`

Method: `DELETE`  
Auth Required: `Yes`

Request Payload:

```json
{}
```

Success Response:

```json
{
  "success": true,
  "message": "Address deleted",
  "data": {}
}
```

Error Response:

```json
{
  "success": false,
  "message": "Address not found",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `404`
- `500`

Validation Rules:

- soft delete only

## 6. Birth Profile Module

Release Scope:

- This module is optional enrichment scope.
- Core commerce evaluation should not depend on implementing it.

### Endpoint

`GET /api/v1/birth-profiles`

Method: `GET`  
Auth Required: `Yes`

Request Payload:

```json
{}
```

Success Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "items": []
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Unauthorized",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `500`

Validation Rules:

- authenticated user only

### Endpoint

`POST /api/v1/birth-profiles`

Method: `POST`  
Auth Required: `Yes`

Request Payload:

```json
{
  "fullName": "Vishnu Sharma",
  "dateOfBirth": "1995-08-15",
  "timeOfBirth": "10:35:00",
  "placeOfBirth": "Delhi, India",
  "notes": "Primary birth profile"
}
```

Success Response:

```json
{
  "success": true,
  "message": "Birth profile created",
  "data": {
    "id": "665c901f8c3c2d7f9b8a1241"
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Validation Failed",
  "errors": []
}
```

Status Codes:

- `201`
- `401`
- `422`
- `500`

Validation Rules:

- `dateOfBirth`: required, `YYYY-MM-DD`
- `timeOfBirth`: optional, `HH:mm:ss`

### Endpoint

`PUT /api/v1/birth-profiles/{birthProfileId}`

Method: `PUT`  
Auth Required: `Yes`

Request Payload:

```json
{
  "fullName": "Vishnu Sharma",
  "dateOfBirth": "1995-08-15",
  "timeOfBirth": "10:35:00",
  "placeOfBirth": "Delhi, India",
  "notes": "Updated"
}
```

Success Response:

```json
{
  "success": true,
  "message": "Birth profile updated",
  "data": {}
}
```

Error Response:

```json
{
  "success": false,
  "message": "Birth profile not found",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `404`
- `422`
- `500`

Validation Rules:

- profile must belong to authenticated user

### Endpoint

`DELETE /api/v1/birth-profiles/{birthProfileId}`

Method: `DELETE`  
Auth Required: `Yes`

Request Payload:

```json
{}
```

Success Response:

```json
{
  "success": true,
  "message": "Birth profile deleted",
  "data": {}
}
```

Error Response:

```json
{
  "success": false,
  "message": "Birth profile not found",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `404`
- `500`

Validation Rules:

- soft delete only

## 7. Category Module

### Endpoint

`GET /api/v1/categories`

Method: `GET`  
Auth Required: `No`

Request Payload:

```json
{}
```

Success Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "items": [
      {
        "id": "665c902f8c3c2d7f9b8a1242",
        "name": "Gemstones",
        "slug": "gemstones",
        "description": "Natural astrology gemstones",
        "imageUrl": "https://cdn.example.com/categories/gemstones.jpg"
      }
    ]
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Internal server error",
  "errors": []
}
```

Status Codes:

- `200`
- `500`

Validation Rules:

- return only active non-deleted categories

### Endpoint

`GET /api/v1/categories/{categoryId}`

Method: `GET`  
Auth Required: `No`

Request Payload:

```json
{}
```

Success Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "665c902f8c3c2d7f9b8a1242",
    "name": "Gemstones",
    "slug": "gemstones",
    "description": "Natural astrology gemstones"
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Category not found",
  "errors": []
}
```

Status Codes:

- `200`
- `404`
- `500`

Validation Rules:

- `categoryId`: valid ObjectId

### Endpoint

`GET /api/v1/categories/{categoryId}/products`

Method: `GET`  
Auth Required: `No`

Request Payload:

```json
{}
```

Success Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "items": []
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Category not found",
  "errors": []
}
```

Status Codes:

- `200`
- `404`
- `500`

Validation Rules:

- supports standard product list filters and sorting
- attribute filter contract:
  - `GET /api/v1/products?attributes[metal]=gold&attributes[carat]=5.25`
  - repeated filter keys are allowed where the client framework supports them
  - backend must document the final parser strategy in code if it expands beyond this contract

## 8. Product Module

### Endpoint

`GET /api/v1/products`

Method: `GET`  
Auth Required: `No`

Request Payload:

```json
{}
```

Success Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "page": 1,
    "limit": 20,
    "total": 500,
    "totalPages": 25,
    "items": [
      {
        "id": "665c903f8c3c2d7f9b8a1243",
        "name": "Natural Ruby Ring",
        "slug": "natural-ruby-ring",
        "shortDescription": "Certified natural ruby ring",
        "coverImageUrl": "https://cdn.example.com/products/ruby-cover.jpg",
        "minPrice": "7999.00",
        "maxPrice": "10999.00",
        "isFeatured": true,
        "isInStock": true
      }
    ]
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Validation Failed",
  "errors": []
}
```

Status Codes:

- `200`
- `400`
- `422`
- `500`

Validation Rules:

- query params: `page`, `limit`, `search`, `categoryId`, `minPrice`, `maxPrice`, `sort`, `featured`, `inStock`
- query params for variant attribute filters use bracket notation, example:
  - `attributes[metal]=gold`
  - `attributes[carat]=5.25`
- `sort`: `newest`, `priceAsc`, `priceDesc`, `popularity`

### Endpoint

`GET /api/v1/products/{productId}`

Method: `GET`  
Auth Required: `No`

Request Payload:

```json
{}
```

Success Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "665c903f8c3c2d7f9b8a1243",
    "name": "Natural Ruby Ring",
    "slug": "natural-ruby-ring",
    "shortDescription": "Certified natural ruby ring",
    "description": "Premium certified ruby ring for astrology purposes.",
    "coverImageUrl": "https://cdn.example.com/products/ruby-cover.jpg",
    "images": [],
    "attributes": [],
    "variants": [],
    "reviewsSummary": {
      "averageRating": "4.70",
      "totalReviews": 10
    }
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Product not found",
  "errors": []
}
```

Status Codes:

- `200`
- `404`
- `500`

Validation Rules:

- return only published active non-deleted products

### Endpoint

`GET /api/v1/products/featured`

Method: `GET`  
Auth Required: `No`

Request Payload:

```json
{}
```

Success Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "items": []
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Internal server error",
  "errors": []
}
```

Status Codes:

- `200`
- `500`

Validation Rules:

- return featured published active products only

### Endpoint

`GET /api/v1/products/{productId}/related`

Method: `GET`  
Auth Required: `No`

Request Payload:

```json
{}
```

Success Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "items": []
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Product not found",
  "errors": []
}
```

Status Codes:

- `200`
- `404`
- `500`

Validation Rules:

- product must exist and be visible

## 9. Wishlist Module

### Endpoint

`GET /api/v1/wishlist`

Method: `GET`  
Auth Required: `Yes`

Request Payload:

```json
{}
```

Success Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "items": []
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Unauthorized",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `500`

Validation Rules:

- authenticated user only

### Endpoint

`POST /api/v1/wishlist`

Method: `POST`  
Auth Required: `Yes`

Request Payload:

```json
{
  "productId": "665c903f8c3c2d7f9b8a1243"
}
```

Success Response:

```json
{
  "success": true,
  "message": "Added to wishlist",
  "data": {}
}
```

Error Response:

```json
{
  "success": false,
  "message": "Product already in wishlist",
  "errors": []
}
```

Status Codes:

- `201`
- `401`
- `404`
- `409`
- `500`

Validation Rules:

- `productId`: required, valid ObjectId

### Endpoint

`DELETE /api/v1/wishlist/{productId}`

Method: `DELETE`  
Auth Required: `Yes`

Request Payload:

```json
{}
```

Success Response:

```json
{
  "success": true,
  "message": "Wishlist item removed",
  "data": {}
}
```

Error Response:

```json
{
  "success": false,
  "message": "Wishlist item not found",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `404`
- `500`

Validation Rules:

- `productId`: required, valid ObjectId

## 10. Cart Module

### Endpoint

`GET /api/v1/cart`

Method: `GET`  
Auth Required: `Yes`

Request Payload:

```json
{}
```

Success Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "665c905f8c3c2d7f9b8a1244",
    "items": [],
    "pricing": {
      "subTotal": "15998.00",
      "discountTotal": "500.00",
      "shippingFee": "0.00",
      "codFee": "0.00",
      "taxTotal": "0.00",
      "grandTotal": "15498.00"
    },
    "couponCode": "WELCOME10"
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Unauthorized",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `500`

Validation Rules:

- cart is created lazily if absent

### Endpoint

`POST /api/v1/cart/items`

Method: `POST`  
Auth Required: `Yes`

Request Payload:

```json
{
  "productId": "665c903f8c3c2d7f9b8a1243",
  "productSkuId": "665c903f8c3c2d7f9b8a1245",
  "quantity": 2
}
```

Success Response:

```json
{
  "success": true,
  "message": "Cart updated",
  "data": {
    "cartId": "665c905f8c3c2d7f9b8a1244"
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Insufficient stock",
  "errors": [
    {
      "field": "quantity",
      "message": "Requested quantity exceeds available stock"
    }
  ]
}
```

Status Codes:

- `200`
- `401`
- `404`
- `422`
- `500`

Validation Rules:

- `quantity`: required, integer, min 1
- product and SKU must be active

### Endpoint

`PATCH /api/v1/cart/items/{cartItemId}`

Method: `PATCH`  
Auth Required: `Yes`

Request Payload:

```json
{
  "quantity": 3
}
```

Success Response:

```json
{
  "success": true,
  "message": "Cart item updated",
  "data": {}
}
```

Error Response:

```json
{
  "success": false,
  "message": "Cart item not found",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `404`
- `422`
- `500`

Validation Rules:

- `quantity`: integer, min 1

### Endpoint

`DELETE /api/v1/cart/items/{cartItemId}`

Method: `DELETE`  
Auth Required: `Yes`

Request Payload:

```json
{}
```

Success Response:

```json
{
  "success": true,
  "message": "Cart item removed",
  "data": {}
}
```

Error Response:

```json
{
  "success": false,
  "message": "Cart item not found",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `404`
- `500`

Validation Rules:

- `cartItemId`: valid embedded cart item ID string

### Endpoint

`POST /api/v1/cart/apply-coupon`

Method: `POST`  
Auth Required: `Yes`

Request Payload:

```json
{
  "couponCode": "WELCOME10"
}
```

Success Response:

```json
{
  "success": true,
  "message": "Coupon applied",
  "data": {
    "couponCode": "WELCOME10",
    "discountTotal": "500.00"
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Coupon invalid",
  "errors": [
    {
      "field": "couponCode",
      "message": "Coupon is expired or not applicable"
    }
  ]
}
```

Status Codes:

- `200`
- `401`
- `404`
- `409`
- `422`
- `500`

Validation Rules:

- one coupon per cart
- no stacking

### Endpoint

`DELETE /api/v1/cart/coupon`

Method: `DELETE`  
Auth Required: `Yes`

Request Payload:

```json
{}
```

Success Response:

```json
{
  "success": true,
  "message": "Coupon removed",
  "data": {}
}
```

Error Response:

```json
{
  "success": false,
  "message": "No coupon applied",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `404`
- `500`

Validation Rules:

- recalculates cart totals after removal

## 11. Checkout Module

### Endpoint

`POST /api/v1/checkout/preview`

Method: `POST`  
Auth Required: `Yes`

Request Payload:

```json
{
  "shippingAddressId": "665c901f8c3c2d7f9b8a1240",
  "billingAddressId": "665c901f8c3c2d7f9b8a1240",
  "couponCode": "WELCOME10",
  "paymentMethod": "razorpay"
}
```

Success Response:

```json
{
  "success": true,
  "message": "Checkout preview generated",
  "data": {
    "subTotal": "15998.00",
    "discountTotal": "500.00",
    "shippingFee": "0.00",
    "codFee": "0.00",
    "taxTotal": "0.00",
    "grandTotal": "15498.00"
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "COD not allowed",
  "errors": [
    {
      "field": "paymentMethod",
      "message": "COD is allowed only for orders up to 10000.00"
    }
  ]
}
```

Status Codes:

- `200`
- `401`
- `404`
- `422`
- `500`

Validation Rules:

- addresses must belong to user
- cart must not be empty
- payment method required

### Endpoint

`POST /api/v1/checkout/place-order`

Method: `POST`  
Auth Required: `Yes`

Request Payload:

```json
{
  "shippingAddressId": "665c901f8c3c2d7f9b8a1240",
  "billingAddressId": "665c901f8c3c2d7f9b8a1240",
  "couponCode": "WELCOME10",
  "paymentMethod": "razorpay",
  "customerNote": "Deliver after 5 PM"
}
```

Success Response:

```json
{
  "success": true,
  "message": "Order placed",
  "data": {
    "orderId": "665c907f8c3c2d7f9b8a1246",
    "orderNumber": "ORD-20260616-0001",
    "status": "pending",
    "paymentMethod": "razorpay",
    "reservationExpiresAt": "2026-06-16T10:15:00Z"
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Insufficient stock",
  "errors": [
    {
      "field": "items",
      "message": "One or more items are no longer available"
    }
  ]
}
```

Status Codes:

- `201`
- `401`
- `404`
- `409`
- `422`
- `500`

Validation Rules:

- cart locked to backend pricing
- reserve inventory for 15 minutes
- COD allowed only if total `<= 10000.00`

## 12. Payment Module

### Endpoint

`POST /api/v1/payments/create`

Method: `POST`  
Auth Required: `Yes`

Request Payload:

```json
{
  "orderId": "665c907f8c3c2d7f9b8a1246"
}
```

Success Response:

```json
{
  "success": true,
  "message": "Payment session created",
  "data": {
    "paymentId": "665c908f8c3c2d7f9b8a1247",
    "provider": "razorpay",
    "providerOrderId": "order_xxx",
    "amount": "15498.00",
    "currency": "INR"
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Order not payable",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `404`
- `409`
- `500`

Validation Rules:

- prepaid methods only
- order must belong to authenticated user
- order status must be `pending`

### Endpoint

`POST /api/v1/payments/verify`

Method: `POST`  
Auth Required: `Yes`

Request Payload:

```json
{
  "orderId": "665c907f8c3c2d7f9b8a1246",
  "paymentId": "pay_xxx",
  "signature": "signature"
}
```

Success Response:

```json
{
  "success": true,
  "message": "Payment callback accepted",
  "data": {
    "orderId": "665c907f8c3c2d7f9b8a1246",
    "status": "pending",
    "paymentStatus": "authorized",
    "verificationAccepted": true
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Payment verification failed",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `404`
- `422`
- `500`

Validation Rules:

- webhook verification remains mandatory for final reconciliation
- `signature`: required for supported gateways
- this endpoint validates frontend-returned gateway data only
- this endpoint does not by itself finalize prepaid settlement unless the same event is confirmed by verified webhook processing

### Endpoint

`POST /api/v1/payments/webhooks/razorpay`

Method: `POST`  
Auth Required: `No`

Request Payload:

```json
{
  "event": "payment.captured",
  "payload": {}
}
```

Success Response:

```json
{
  "success": true,
  "message": "Webhook processed",
  "data": {}
}
```

Error Response:

```json
{
  "success": false,
  "message": "Webhook signature invalid",
  "errors": []
}
```

Status Codes:

- `200`
- `400`
- `401`
- `409`
- `500`

Validation Rules:

- signature verification mandatory
- webhook idempotency mandatory

### Endpoint

`POST /api/v1/payments/webhooks/cashfree`

Method: `POST`  
Auth Required: `No`

Request Payload:

```json
{
  "type": "PAYMENT_SUCCESS_WEBHOOK",
  "data": {}
}
```

Success Response:

```json
{
  "success": true,
  "message": "Webhook processed",
  "data": {}
}
```

Error Response:

```json
{
  "success": false,
  "message": "Webhook signature invalid",
  "errors": []
}
```

Status Codes:

- `200`
- `400`
- `401`
- `409`
- `500`

Validation Rules:

- signature verification mandatory
- webhook idempotency mandatory

## 13. Orders Module

### Endpoint

`GET /api/v1/orders`

Method: `GET`  
Auth Required: `Yes`

Request Payload:

```json
{}
```

Success Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "items": []
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Unauthorized",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `500`

Validation Rules:

- supports filters by `status` and date range

### Endpoint

`GET /api/v1/orders/{orderId}`

Method: `GET`  
Auth Required: `Yes`

Request Payload:

```json
{}
```

Success Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "665c907f8c3c2d7f9b8a1246",
    "orderNumber": "ORD-20260616-0001",
    "status": "confirmed",
    "pricing": {
      "grandTotal": "15498.00"
    },
    "items": [],
    "shipment": {},
    "paymentMethod": "razorpay"
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Order not found",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `404`
- `500`

Validation Rules:

- order must belong to authenticated user unless admin

### Endpoint

`GET /api/v1/orders/{orderId}/timeline`

Method: `GET`  
Auth Required: `Yes`

Request Payload:

```json
{}
```

Success Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "items": [
      {
        "fromStatus": "pending",
        "toStatus": "confirmed",
        "remarks": "Payment verified",
        "createdAt": "2026-06-16T10:20:00Z"
      }
    ]
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Order not found",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `404`
- `500`

Validation Rules:

- same ownership rule as order detail

### Endpoint

`GET /api/v1/orders/{orderId}/invoice`

Method: `GET`  
Auth Required: `Yes`

Request Payload:

```json
{}
```

Success Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "invoiceNumber": "INV-20260616-0001",
    "invoiceUrl": "https://cdn.example.com/invoices/INV-20260616-0001.pdf"
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Invoice not found",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `404`
- `500`

Validation Rules:

- invoice available after issuance

### Endpoint

`POST /api/v1/orders/{orderId}/cancel`

Method: `POST`  
Auth Required: `Yes`

Request Payload:

```json
{
  "reason": "Changed my mind"
}
```

Success Response:

```json
{
  "success": true,
  "message": "Order cancelled",
  "data": {
    "status": "cancelled"
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Order cannot be cancelled",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `403`
- `404`
- `409`
- `500`

Validation Rules:

- customer allowed only for `pending` and `confirmed`

## 14. Reviews Module

### Endpoint

`GET /api/v1/products/{productId}/reviews`

Method: `GET`  
Auth Required: `No`

Request Payload:

```json
{}
```

Success Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1,
    "items": []
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Product not found",
  "errors": []
}
```

Status Codes:

- `200`
- `404`
- `500`

Validation Rules:

- only approved, non-deleted reviews returned publicly

### Endpoint

`POST /api/v1/products/{productId}/reviews`

Method: `POST`  
Auth Required: `Yes`

Request Payload:

```json
{
  "rating": 5,
  "title": "Excellent",
  "review": "Authentic gemstone",
  "imageUrls": [
    "https://cdn.example.com/reviews/review-1.jpg"
  ]
}
```

Success Response:

```json
{
  "success": true,
  "message": "Review submitted for moderation",
  "data": {
    "reviewId": "665c909f8c3c2d7f9b8a1248",
    "status": "pending"
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Review not allowed",
  "errors": [
    {
      "field": "productId",
      "message": "Only verified purchasers can review this product"
    }
  ]
}
```

Status Codes:

- `201`
- `401`
- `403`
- `404`
- `409`
- `422`
- `500`

Validation Rules:

- rating `1..5`
- one review per user per product
- max 5 image URLs

### Endpoint

`PUT /api/v1/reviews/{reviewId}`

Method: `PUT`  
Auth Required: `Yes`

Request Payload:

```json
{
  "rating": 4,
  "title": "Updated review",
  "review": "Updated content",
  "imageUrls": []
}
```

Success Response:

```json
{
  "success": true,
  "message": "Review updated and sent for moderation",
  "data": {
    "status": "pending"
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Review not found",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `403`
- `404`
- `422`
- `500`

Validation Rules:

- review must belong to authenticated user
- edited review returns to `pending`

### Endpoint

`DELETE /api/v1/reviews/{reviewId}`

Method: `DELETE`  
Auth Required: `Yes`

Request Payload:

```json
{}
```

Success Response:

```json
{
  "success": true,
  "message": "Review deleted",
  "data": {}
}
```

Error Response:

```json
{
  "success": false,
  "message": "Review not found",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `403`
- `404`
- `500`

Validation Rules:

- soft delete only

## 15. Returns Module

### Endpoint

`POST /api/v1/returns`

Method: `POST`  
Auth Required: `Yes`

Request Payload:

```json
{
  "orderId": "665c907f8c3c2d7f9b8a1246",
  "reason": "damaged_product",
  "description": "Stone was cracked",
  "items": [
    {
      "orderItemId": "665c907f8c3c2d7f9b8a1249",
      "quantity": 1
    }
  ],
  "refundDestination": {
    "method": "upi",
    "upiId": "vishnu@upi",
    "accountHolderName": null,
    "bankAccountNumber": null,
    "ifscCode": null
  }
}
```

Success Response:

```json
{
  "success": true,
  "message": "Return requested",
  "data": {
    "returnId": "665c90af8c3c2d7f9b8a1250",
    "status": "requested"
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Return not allowed",
  "errors": [
    {
      "field": "orderId",
      "message": "Return window has expired"
    }
  ]
}
```

Status Codes:

- `201`
- `401`
- `403`
- `404`
- `409`
- `422`
- `500`

Validation Rules:

- delivered order only
- within 15 days of delivery
- quantity cannot exceed remaining returnable quantity
- for prepaid orders, `refundDestination` may be omitted and refund goes to original source
- for COD orders, `refundDestination.method` is required and must be `upi`, `bank_account`, or `manual_admin`

### Refund destination object

Field descriptions:

- `method`: `original_source`, `upi`, `bank_account`, or `manual_admin`
- `upiId`: required when `method = upi`
- `accountHolderName`: required when `method = bank_account`
- `bankAccountNumber`: required when `method = bank_account`
- `ifscCode`: required when `method = bank_account`

### Endpoint

`GET /api/v1/returns/{returnId}`

Method: `GET`  
Auth Required: `Yes`

Request Payload:

```json
{}
```

Success Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "665c90af8c3c2d7f9b8a1250",
    "returnNumber": "RET-20260620-0001",
    "status": "requested",
    "items": [],
    "refund": {
      "refundAmount": "7999.00",
      "refundStatus": "pending"
    }
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Return not found",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `404`
- `500`

Validation Rules:

- return must belong to authenticated user unless admin

## 16. Recommendations Module

### Endpoint

`GET /api/v1/products/{productId}/recommendations`

Method: `GET`  
Auth Required: `No`

Request Payload:

```json
{}
```

Success Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "items": []
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Product not found",
  "errors": []
}
```

Status Codes:

- `200`
- `404`
- `500`

Validation Rules:

- return only visible products

## 17. Admin Module

### Endpoint

`GET /api/v1/admin/dashboard`

Method: `GET`  
Auth Required: `Yes (Admin)`

Request Payload:

```json
{}
```

Success Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "ordersToday": 10,
    "paymentsToday": "120000.00",
    "pendingReturns": 2,
    "lowStockSkus": 4
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Forbidden",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `403`
- `500`

Validation Rules:

- admin role required
- role-specific access is governed by the RBAC contract in Section 2

### Endpoint

`GET /api/v1/admin/products`

Method: `GET`  
Auth Required: `Yes (Admin)`

Request Payload:

```json
{}
```

Success Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "items": []
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Forbidden",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `403`
- `500`

Validation Rules:

- includes draft and archived records

### Endpoint

`POST /api/v1/admin/products`

Method: `POST`  
Auth Required: `Yes (Admin)`

Request Payload:

```json
{
  "categoryId": "665c902f8c3c2d7f9b8a1242",
  "name": "Natural Ruby Ring",
  "slug": "natural-ruby-ring",
  "shortDescription": "Certified natural ruby ring",
  "description": "Premium certified ruby ring for astrology purposes.",
  "status": "draft",
  "isFeatured": true,
  "coverImageUrl": "https://cdn.example.com/products/ruby-cover.jpg",
  "images": [],
  "attributeDefinitions": [],
  "skus": [],
  "seo": {
    "metaTitle": "Natural Ruby Ring | Astrology Gemstone",
    "metaDescription": "Buy certified ruby ring for astrology purposes.",
    "canonicalUrl": "/products/natural-ruby-ring",
    "ogTitle": "Natural Ruby Ring",
    "ogDescription": "Premium certified ruby ring",
    "ogImageUrl": "https://cdn.example.com/products/ruby-cover.jpg"
  }
}
```

Success Response:

```json
{
  "success": true,
  "message": "Product created",
  "data": {
    "id": "665c903f8c3c2d7f9b8a1243"
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Slug already exists",
  "errors": []
}
```

Status Codes:

- `201`
- `401`
- `403`
- `409`
- `422`
- `500`

Validation Rules:

- `slug`: unique
- at least one SKU required before publish

### Endpoint

`PUT /api/v1/admin/products/{productId}`

Method: `PUT`  
Auth Required: `Yes (Admin)`

Request Payload:

```json
{
  "name": "Natural Ruby Ring Updated",
  "status": "published",
  "isActive": true,
  "images": [],
  "attributeDefinitions": [],
  "skus": []
}
```

Success Response:

```json
{
  "success": true,
  "message": "Product updated",
  "data": {}
}
```

Error Response:

```json
{
  "success": false,
  "message": "Product not found",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `403`
- `404`
- `409`
- `422`
- `500`

Validation Rules:

- publishing requires valid SKU pricing and active category

### Endpoint

`DELETE /api/v1/admin/products/{productId}`

Method: `DELETE`  
Auth Required: `Yes (Admin)`

Request Payload:

```json
{}
```

Success Response:

```json
{
  "success": true,
  "message": "Product deleted",
  "data": {}
}
```

Error Response:

```json
{
  "success": false,
  "message": "Product not found",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `403`
- `404`
- `500`

Validation Rules:

- soft delete only

### Endpoint

`GET /api/v1/admin/orders`

Method: `GET`  
Auth Required: `Yes (Admin)`

Request Payload:

```json
{}
```

Success Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "items": []
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Forbidden",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `403`
- `500`

Validation Rules:

- supports filters by status, payment method, date range, order number

### Endpoint

`PUT /api/v1/admin/orders/{orderId}/status`

Method: `PUT`  
Auth Required: `Yes (Admin)`

Request Payload:

```json
{
  "status": "shipped",
  "remarks": "Handed to courier",
  "courierName": "Delhivery",
  "trackingNumber": "DLV123456789",
  "awbNumber": "AWB123456",
  "trackingUrl": "https://tracking.example.com/DLV123456789"
}
```

Success Response:

```json
{
  "success": true,
  "message": "Order status updated",
  "data": {}
}
```

Error Response:

```json
{
  "success": false,
  "message": "Invalid order transition",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `403`
- `404`
- `409`
- `422`
- `500`

Validation Rules:

- transitions must follow allowed lifecycle
- shipment fields required when status becomes `shipped`

### Endpoint

`GET /api/v1/admin/coupons`

Method: `GET`  
Auth Required: `Yes (Admin)`

Request Payload:

```json
{}
```

Success Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "items": []
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Forbidden",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `403`
- `500`

Validation Rules:

- admin role required

### Endpoint

`POST /api/v1/admin/coupons`

Method: `POST`  
Auth Required: `Yes (Admin)`

Request Payload:

```json
{
  "code": "WELCOME10",
  "name": "Welcome Offer",
  "discountType": "percentage",
  "discountValue": "10.00",
  "minimumOrderAmount": "1000.00",
  "maximumDiscountAmount": "500.00",
  "usageLimit": 1000,
  "perUserLimit": 1,
  "isFirstOrderOnly": true,
  "allowedPaymentMethods": ["razorpay", "cashfree", "cod"],
  "categoryIds": ["665c902f8c3c2d7f9b8a1242"],
  "productIds": [],
  "startsAt": "2026-06-16T00:00:00Z",
  "endsAt": "2026-07-16T00:00:00Z",
  "isActive": true
}
```

Success Response:

```json
{
  "success": true,
  "message": "Coupon created",
  "data": {
    "id": "665c90bf8c3c2d7f9b8a1251"
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Coupon code already exists",
  "errors": []
}
```

Status Codes:

- `201`
- `401`
- `403`
- `409`
- `422`
- `500`

Validation Rules:

- `code`: unique uppercase
- one coupon per order, no stacking enforced at checkout

### Endpoint

`GET /api/v1/admin/reviews`

Method: `GET`  
Auth Required: `Yes (Admin)`

Request Payload:

```json
{}
```

Success Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "items": []
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Forbidden",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `403`
- `500`

Validation Rules:

- supports `status` filter

### Endpoint

`PUT /api/v1/admin/reviews/{reviewId}/approve`

Method: `PUT`  
Auth Required: `Yes (Admin)`

Request Payload:

```json
{
  "remarks": "Looks good"
}
```

Success Response:

```json
{
  "success": true,
  "message": "Review approved",
  "data": {}
}
```

Error Response:

```json
{
  "success": false,
  "message": "Review not found",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `403`
- `404`
- `500`

Validation Rules:

- review must be `pending` or `rejected`

### Endpoint

`PUT /api/v1/admin/reviews/{reviewId}/reject`

Method: `PUT`  
Auth Required: `Yes (Admin)`

Request Payload:

```json
{
  "reason": "Contains prohibited content"
}
```

Success Response:

```json
{
  "success": true,
  "message": "Review rejected",
  "data": {}
}
```

Error Response:

```json
{
  "success": false,
  "message": "Review not found",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `403`
- `404`
- `422`
- `500`

Validation Rules:

- `reason`: required, 3-255 chars

### Endpoint

`GET /api/v1/admin/inventory`

Method: `GET`  
Auth Required: `Yes (Admin)`

Request Payload:

```json
{}
```

Success Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "items": []
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Forbidden",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `403`
- `500`

Validation Rules:

- includes available, reserved, and low-stock fields

### Endpoint

`POST /api/v1/admin/inventory/adjust`

Method: `POST`  
Auth Required: `Yes (Admin)`

Request Payload:

```json
{
  "productId": "665c903f8c3c2d7f9b8a1243",
  "productSkuId": "665c903f8c3c2d7f9b8a1245",
  "quantityDelta": 5,
  "remarks": "Stock correction"
}
```

Success Response:

```json
{
  "success": true,
  "message": "Inventory adjusted",
  "data": {}
}
```

Error Response:

```json
{
  "success": false,
  "message": "Invalid adjustment",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `403`
- `404`
- `422`
- `500`

Validation Rules:

- resulting available stock cannot be negative

### Endpoint

`GET /api/v1/admin/returns`

Method: `GET`  
Auth Required: `Yes (Admin)`

Request Payload:

```json
{}
```

Success Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "items": []
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Forbidden",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `403`
- `500`

Validation Rules:

- supports `status` filter

### Endpoint

`PUT /api/v1/admin/returns/{returnId}/status`

Method: `PUT`  
Auth Required: `Yes (Admin)`

Request Payload:

```json
{
  "status": "approved",
  "remarks": "Return accepted"
}
```

Success Response:

```json
{
  "success": true,
  "message": "Return status updated",
  "data": {}
}
```

Error Response:

```json
{
  "success": false,
  "message": "Invalid return transition",
  "errors": []
}
```

Status Codes:

- `200`
- `401`
- `403`
- `404`
- `409`
- `422`
- `500`

Validation Rules:

- transitions must follow return lifecycle

## 18. Status Code Semantics

- `200`: successful read or update
- `201`: successful resource creation
- `400`: malformed request
- `401`: authentication missing or invalid
- `403`: authenticated but not allowed
- `404`: resource not found
- `409`: business conflict or duplicate state
- `422`: validation failed
- `500`: unexpected server error
