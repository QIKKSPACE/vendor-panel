import { Package } from 'lucide-react';
import { ProductOrder } from '../types';
import MobileSliderNav from "../components/MobileSliderNav";

interface AcceptOrdersProps {
  orders: ProductOrder[];
  onUpdateOrderStatus: (orderId: string, status: 'accepted' | 'rejected' | 'completed') => void;
}

export default function AcceptOrders({ orders, onUpdateOrderStatus }: AcceptOrdersProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <MobileSliderNav />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-gray-800">Accept Orders</h2>
      </div>

      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">No orders yet</p>
      </div>
    </div>
  );
}