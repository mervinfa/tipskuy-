export type Role = "CUSTOMER" | "DRIVER";

export type ServiceType = "JASTIP" | "ANTAR_JEMPUT";

export type PaymentMethod = "QRIS" | "VIRTUAL_ACCOUNT" | "MOCK_TRANSFER";

export type OrderStatus =
  | "DRAFT"
  | "WAITING_DRIVER_PRICING"
  | "WAITING_CUSTOMER_PAYMENT"
  | "PAID_HELD_IN_ESCROW"
  | "IN_TRANSIT"
  | "DELIVERED_PENDING_CONFIRMATION"
  | "COMPLETED"
  | "CANCELLED_EXPIRED"
  | "REJECTED_BY_CUSTOMER"
  | "REJECTED_BY_DRIVER"
  | "DISPUTED"
  | "REFUNDED";

export type Me = {
  id: string;
  name: string;
  email: string;
  role: Role;
  driverProfile: {
    id: string;
    verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
    whatsappNumber: string;
  } | null;
};

export type CityValue = {
  provinceCode: string;
  cityCode: string;
  cityName: string;
  lat?: number;
  lng?: number;
  zoom?: number;
};

export type Trip = {
  id: string;
  serviceType: ServiceType;
  originProvince?: string;
  originCity: string;
  destProvince?: string;
  destCity: string;
  baseFee: number;
  departureAt: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  driver?: {
    id: string;
    name: string;
    vehicleType: string;
    verified: boolean;
  };
};

export type MyTrip = {
  id: string;
  serviceType: ServiceType;
  originCity: string;
  destCity: string;
  baseFee: number;
  departureAt: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  activeOrderCount: number;
};

export type OrderItem = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string;
  quantity: number;
  estimatedPrice: number | null;
  finalPrice: number | null;
};

export type OrderDetail = {
  id: string;
  status: OrderStatus;
  tripId: string | null;
  openRequestId: string | null;
  customerNote: string | null;
  itemSubtotal: number | null;
  serviceFee: number | null;
  platformFee: number | null;
  totalAmount: number | null;
  pricedAt: string | null;
  paymentDeadline: string | null;
  paidAt: string | null;
  startedAt: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  closedAt: string | null;
  closeReason: string | null;
  createdAt: string;
  updatedAt: string;
  serverTime?: string;
  items: OrderItem[];
  trip: {
    id: string;
    serviceType: ServiceType;
    originCity: string;
    destCity: string;
    baseFee: number;
    departureAt: string | null;
    notes: string | null;
  } | null;
  payment: {
    status: string;
    amount: number;
    method: PaymentMethod;
    paidAt: string | null;
  } | null;
  escrow: {
    status: string;
    amount: number;
    platformFee: number;
    releasedAt: string | null;
  } | null;
  deliveryProof: {
    imageUrl: string;
    note: string | null;
    deliveredAt: string | null;
  } | null;
  driver: { id: string; user: { id: string; name: string } } | null;
  customer: { id: string; name: string } | null;
};

export type OrderListItem = {
  id: string;
  status: OrderStatus;
  tripId: string | null;
  openRequestId: string | null;
  itemSubtotal: number | null;
  serviceFee: number | null;
  platformFee: number | null;
  totalAmount: number | null;
  pricedAt: string | null;
  paymentDeadline: string | null;
  closedAt: string | null;
  closeReason: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { items: number };
  customer: { id: string; name: string };
  driver: { id: string; user: { id: string; name: string } };
};

export type OpenRequest = {
  id: string;
  serviceType: ServiceType;
  originCityCode: string;
  originCity: string;
  destCityCode: string;
  destCity: string;
  description: string;
  imageUrl: string | null;
  status: "OPEN" | "CLAIMED" | "CLOSED";
  expiresAt: string;
  createdAt: string;
  customer: { id: string; name: string };
};

export type WalletTransaction = {
  id: string;
  type: "ESCROW_RELEASE" | "WITHDRAWAL" | "ADJUSTMENT";
  amount: number;
  balanceAfter: number;
  orderId: string | null;
  note: string | null;
  createdAt: string;
};

export type Wallet = {
  balance: number;
  transactions: {
    items: WalletTransaction[];
    page: number;
    pageSize: number;
    total: number;
  };
};

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  orderId: string | null;
  readAt: string | null;
  createdAt: string;
};

export type OffsetPage<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
  serverTime?: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  sender: { id: string; name: string };
};

export type ConversationSummary = {
  id: string;
  customerId: string;
  driverId: string;
  tripId: string | null;
  orderId: string | null;
  createdAt: string;
  updatedAt: string;
  customer: { id: string; name: string };
  driver: { id: string; user: { id: string; name: string } };
  trip: {
    id: string;
    serviceType: ServiceType;
    originCity: string;
    destCity: string;
    departureAt: string | null;
  } | null;
  order: { id: string; status: OrderStatus } | null;
  lastMessage: {
    id: string;
    senderId: string;
    body: string;
    createdAt: string;
  } | null;
};
