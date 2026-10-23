export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  selling_price?: number;
  sellingPrice?: number;
  mrp?: number;
  imageUrl: string;
  images?: any[];
  stockQuantity: number;
  stock_quantity?: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  category_id?: string;
  sub_category_id?: string;
  product_code?: string;
  brand_name?: string;
  quality_tier?: string;
  quality_tier_description?: string;
  available_sizes?: string[];
  available_colors?: string[];
  weight?: string;
  dimensions?: string;
  hsn_code?: string;
  gst_percentage?: string | number;
  specifications?: { key: string; value: string }[];
  category_hierarchy?: any[];
  [key: string]: any;
}

export interface ProductOrder {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  quantity: number;
  totalAmount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  orderDate: Date;
  acceptedAt?: Date;
  completedAt?: Date;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
}

export interface Service {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  status: 'active' | 'inactive';
  createdAt: Date;
}

export interface ServiceSlot {
  id: string;
  serviceId: string;
  serviceName: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  createdAt: Date;
}

export interface ServiceRequest {
  id: string;
  serviceId: string;
  serviceName: string;
  slotId?: string;
  slotDate?: string;
  slotTime?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  requestDate: Date;
  acceptedAt?: Date;
  completedAt?: Date;
}

export interface ServiceImage {
  id: string;
  image_url: string;
  sort_order?: number;
}

export interface BookingServiceItem {
  id: string;
  name: string;
  description?: string;
  price: string | number;
  service_images?: ServiceImage[];
}

export interface VendorBooking {
  id: string;
  vendor_id: string;
  user_id: string;
  employee_slot?: number | string | null;
  start_ts: string;
  end_ts: string;
  slot_date: string;
  status: string;
  metadata?: any;
  is_reschedule?: boolean;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  can_reschedule?: boolean;
  services: BookingServiceItem[];
}

export type PackageType = 'QUANTITY_DISCOUNT' | 'PRODUCT_BUNDLE' | 'SERVICE_BUNDLE';
export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FIXED_PRICE';
export type PackageStatus = 'draft' | 'active' | 'paused' | 'archived';

export interface PackageItem {
  id?: string;
  package_id?: string;
  product_id?: string | null;
  service_id?: string | null;
  quantity: number;
  product?: Product;
  service?: any;
}

export interface Package {
  id: string;
  vendor_id?: string;
  name: string;
  description?: string;
  package_type: PackageType;
  discount_type: DiscountType;
  discount_value: number | string;
  status: PackageStatus;
  max_purchases?: number | null;
  created_at?: string | Date;
  updated_at?: string | Date;
  items: PackageItem[];
}


