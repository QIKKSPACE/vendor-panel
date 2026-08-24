export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stockQuantity: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  category_id?: string;
  sub_category_id?: string;
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
