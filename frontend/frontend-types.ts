export type ObjectIdString = string;
export type MoneyString = string;
export type IsoDateString = string;

export type UserRole =
  | "customer"
  | "admin"
  | "superAdmin"
  | "catalogManager"
  | "orderManager"
  | "supportAgent";

export type ProductStatus = "draft" | "published" | "archived";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "razorpay" | "cashfree" | "cod";
export type PaymentStatus =
  | "pending"
  | "paymentLinkCreated"
  | "authorized"
  | "paid"
  | "failed"
  | "cancelled"
  | "refundPending"
  | "partiallyRefunded"
  | "refunded";

export type ReviewStatus = "pending" | "approved" | "rejected";
export type ReturnStatus =
  | "requested"
  | "approved"
  | "pickupScheduled"
  | "received"
  | "refundInitiated"
  | "completed"
  | "rejected";

export type ApiFieldError = {
  field: string;
  message: string;
};

export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type ApiError = {
  success: false;
  message: string;
  errors: ApiFieldError[];
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type Paginated<T> = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  items: T[];
};

export type User = {
  id: ObjectIdString;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phoneNumber: string;
  avatarUrl?: string | null;
  role: UserRole;
  createdAt?: IsoDateString;
  updatedAt?: IsoDateString;
};

export type Address = {
  id: ObjectIdString;
  type: "home" | "work" | "other";
  title: string;
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  country: "India";
  postalCode: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
  gstin?: string | null;
  companyName?: string | null;
};

export type BirthProfile = {
  id: ObjectIdString;
  fullName: string;
  dateOfBirth: string;
  timeOfBirth?: string | null;
  placeOfBirth: string;
  notes?: string | null;
};

export type Category = {
  id: ObjectIdString;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
};

export type ProductImage = {
  id?: ObjectIdString;
  imageUrl: string;
  altText?: string | null;
  displayOrder?: number;
};

export type ProductAttributeDefinition = {
  code: string;
  label: string;
  type: "text" | "number" | "select";
  isRequired: boolean;
  isFilterable: boolean;
  isVariantAxis: boolean;
  options: string[];
};

export type ProductVariantAttribute = {
  code: string;
  value: string;
};

export type ProductVariant = {
  id: ObjectIdString;
  skuCode: string;
  variantName: string;
  attributeValues: ProductVariantAttribute[];
  price: MoneyString;
  compareAtPrice?: MoneyString | null;
  availableQuantity?: number;
  isActive?: boolean;
};

export type ProductListItem = {
  id: ObjectIdString;
  name: string;
  slug: string;
  shortDescription: string;
  coverImageUrl?: string | null;
  minPrice: MoneyString;
  maxPrice: MoneyString;
  isFeatured: boolean;
  isInStock: boolean;
};

export type ProductDetail = {
  id: ObjectIdString;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  coverImageUrl?: string | null;
  images: ProductImage[];
  attributes: ProductAttributeDefinition[];
  variants: ProductVariant[];
  reviewsSummary: {
    averageRating: MoneyString;
    totalReviews: number;
  };
};

export type WishlistItem = {
  productId: ObjectIdString;
  product: ProductListItem;
};

export type CartItem = {
  id: ObjectIdString;
  productId: ObjectIdString;
  productSkuId: ObjectIdString;
  productName: string;
  skuCode: string;
  variantName: string;
  coverImageUrl?: string | null;
  quantity: number;
  unitPrice: MoneyString;
  lineTotal: MoneyString;
  isAvailable: boolean;
};

export type PriceSummary = {
  subTotal: MoneyString;
  discountTotal: MoneyString;
  shippingFee: MoneyString;
  codFee: MoneyString;
  taxTotal: MoneyString;
  grandTotal: MoneyString;
};

export type Cart = {
  id: ObjectIdString;
  items: CartItem[];
  pricing: PriceSummary;
  couponCode?: string | null;
};

export type OrderItem = {
  id: ObjectIdString;
  productId: ObjectIdString;
  productSkuId: ObjectIdString;
  productName: string;
  skuCode: string;
  variantName: string;
  coverImageUrl?: string | null;
  quantity: number;
  unitPrice: MoneyString;
  lineTotal: MoneyString;
  returnableUntil?: IsoDateString;
};

export type ShipmentInfo = {
  courierName?: string | null;
  trackingNumber?: string | null;
  awbNumber?: string | null;
  trackingUrl?: string | null;
};

export type Order = {
  id: ObjectIdString;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  pricing: PriceSummary;
  items: OrderItem[];
  shipment?: ShipmentInfo;
  placedAt?: IsoDateString;
  confirmedAt?: IsoDateString | null;
  shippedAt?: IsoDateString | null;
  deliveredAt?: IsoDateString | null;
};

export type OrderTimelineItem = {
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  remarks?: string | null;
  createdAt: IsoDateString;
};

export type Review = {
  id: ObjectIdString;
  productId?: ObjectIdString;
  userId?: ObjectIdString;
  rating: number;
  title: string;
  review: string;
  status: ReviewStatus;
  isVerifiedPurchase?: boolean;
  imageUrls?: string[];
  createdAt?: IsoDateString;
  updatedAt?: IsoDateString;
};

export type ReturnItem = {
  orderItemId: ObjectIdString;
  quantity: number;
  refundAmount?: MoneyString;
};

export type ReturnRecord = {
  id: ObjectIdString;
  returnNumber: string;
  status: ReturnStatus;
  items: ReturnItem[];
  refund: {
    refundAmount: MoneyString;
    refundStatus: string;
  };
};
