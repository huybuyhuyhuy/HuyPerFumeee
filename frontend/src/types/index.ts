export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  address: string;
  dob: string | null;
}

export interface Product {
  id: number;
  sku: string;
  batchCode: string;
  name: string;
  price: number;
  discountPrice: number;
  image: string;
  images?: string[];
  description: string;
  scentNotes: string;
  isDecant: boolean;
  status: boolean;
  stock: number;
  volumeMl: number;
  category: { id: number; name: string } | null;
  brand: { id: number; name: string } | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartSummary {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export interface OrderItemInfo {
  id: number;
  productId: number;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  selectedBatchCode: string;
  priceAtPurchase: number;
}

export interface OrderResponse {
  id: number;
  userId: number;
  userName: string;
  total: number;
  shippingAddress: string;
  phone: string;
  paymentMethod: string;
  momoOrderId: string;
  momoTransId: string;
  zalopayAppTransId: string;
  status: string;
  createdAt: string;
  items: OrderItemInfo[];
  paymentUrl?: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}

export interface LoginRequest {
  emailPhone: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  repassword: string;
  address: string;
}

export interface JwtResponse {
  token: string;
  type: string;
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Brand {
  id: number;
  name: string;
  status: boolean;
}
