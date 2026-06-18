# frontend-pages.md

## Customer App

### Public Pages

1. `/`
- Home page
- Featured categories
- Featured products
- Recommendations blocks
- Search entry point

2. `/login`
- Email or phone login
- Password login
- Link to forgot password

3. `/register`
- Registration form
- Terms acceptance

4. `/forgot-password`
- Email submission form

5. `/reset-password`
- Reset token form
- New password form

6. `/categories`
- Category listing

7. `/categories/:categoryId`
- Category details
- Product listing by category
- Filters and sorting

8. `/products`
- Search results
- Product list
- Filters
- Sort
- Pagination

9. `/products/:productId`
- Product gallery
- Variant selection
- Product attributes
- Price display
- Reviews summary
- Review list
- Related products
- Recommendations

## Authenticated Customer Pages

10. `/wishlist`
- Wishlist items
- Remove action
- Add to cart action

11. `/cart`
- Cart item list
- Quantity update
- Remove item
- Apply/remove coupon
- Pricing summary

12. `/checkout`
- Address selection
- Billing/shipping split
- Coupon summary
- Payment method selection
- COD eligibility messaging
- Order totals

13. `/checkout/success/:orderId`
- Order placed confirmation
- Payment result

14. `/account`
- Profile summary
- Navigation to orders, addresses, birth profiles, reviews

15. `/account/profile`
- Edit profile

16. `/account/addresses`
- List addresses
- Create address
- Edit address
- Delete address
- Set default shipping/billing

17. `/account/birth-profiles`
- Optional enrichment module, not required for core commerce MVP
- List profiles
- Create/update/delete profile

18. `/account/orders`
- Orders list
- Status filter
- Pagination

19. `/account/orders/:orderId`
- Order detail
- Timeline
- Shipment status
- Invoice download
- Cancel action if eligible
- Return request CTA if eligible

20. `/account/returns`
- Returns list
- Status list

21. `/account/returns/:returnId`
- Return detail
- Refund status

22. `/account/reviews`
- User-created reviews
- Edit/delete review

## Admin App

23. `/admin/login`
- Admin login

24. `/admin`
- Dashboard
- Metrics cards
- Alerts

25. `/admin/products`
- Product list
- Search/filter/status

26. `/admin/products/new`
- Create product

27. `/admin/products/:productId`
- Edit product
- Manage images
- Manage attributes
- Manage SKUs
- SEO fields

28. `/admin/categories`
- Category list
- Create/edit/delete category

29. `/admin/orders`
- Order list
- Filter by status/payment/date/order number

30. `/admin/orders/:orderId`
- Order detail
- Update status
- Shipment fields
- Admin notes

31. `/admin/payments`
- Payment attempts
- Gateway state list

32. `/admin/inventory`
- SKU inventory
- Stock adjustment
- Low-stock alerts
- Reservation visibility

33. `/admin/coupons`
- Coupon list
- Create/edit/activate/deactivate

34. `/admin/reviews`
- Pending/approved/rejected review queue
- Approve/reject actions

35. `/admin/returns`
- Returns queue
- Approve/reject
- Pickup scheduling
- Refund progression

36. `/admin/users`
- User list
- Block/unblock

37. `/admin/audit-logs`
- Admin activity log

## Shared FE Rules

- All API field names must stay in `camelCase`
- All IDs are Mongo `ObjectId` strings
- All money values are strings and must never be parsed as float for business calculations
- All timestamps are UTC ISO strings
- Final price, stock, coupon validity, and order eligibility come from backend only
