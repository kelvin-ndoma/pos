// app/dashboard/kitchen/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { authHeaders } from '@/lib/apiClient';

type KitchenStatus = 'NEW' | 'PREPARING' | 'READY' | 'SERVED';

type KitchenOrder = {
  _id: string;
  reference?: string;
  type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  kitchenStatus: KitchenStatus;
  createdAt: string;
  notes?: string;
  table?: {
    _id: string;
    name: string;
    area?: string;
  };
  items: Array<{
    _id: string;
    product: {
      _id: string;
      name: string;
      sku?: string;
    };
    quantity: number;
    unitPrice: number;
    notes?: string;
  }>;
};

type FilterType = 'ALL' | 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';

// Sound notification for new orders (optional)
const playNewOrderSound = () => {
  if (typeof window !== 'undefined') {
    const audio = new Audio('/sounds/new-order.mp3'); // Add this sound file
    audio.play().catch(() => {}); // Ignore autoplay restrictions
  }
};

function getStatusColor(status: KitchenStatus): string {
  const colors = {
    NEW: 'bg-blue-950/40 border-blue-900/60 text-blue-300',
    PREPARING: 'bg-amber-950/40 border-amber-900/60 text-amber-300',
    READY: 'bg-green-950/40 border-green-900/60 text-green-300',
    SERVED: 'bg-slate-800 border-slate-700 text-slate-400',
  };
  return colors[status];
}

function getStatusIcon(status: KitchenStatus) {
  switch (status) {
    case 'NEW':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      );
    case 'PREPARING':
      return (
        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    case 'READY':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'SERVED':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
  }
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  return date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
}

export default function KitchenPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [statusFilter, setStatusFilter] = useState<KitchenStatus | 'ALL'>('ALL');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [prevOrdersCount, setPrevOrdersCount] = useState(0);

  async function loadOrders() {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      if (filter !== 'ALL') params.set('type', filter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/kitchen/orders?${params.toString()}`,
        {
          headers: authHeaders(),
        },
      );

      if (!res.ok) {
        throw new Error('Failed to load orders');
      }

      const data = await res.json();
      const newOrders = Array.isArray(data.data) ? data.data : [];
      
      // Sort orders by createdAt (newest first for NEW, oldest first for others)
      const sortedOrders = newOrders.sort((a: KitchenOrder, b: KitchenOrder) => {
        if (a.kitchenStatus === 'NEW' && b.kitchenStatus === 'NEW') {
          // For NEW orders, show newest first
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else {
          // For other statuses, show oldest first (FIFO)
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
      });

      // Check for new orders (sound notification)
      if (newOrders.length > prevOrdersCount) {
        playNewOrderSound();
      }
      setPrevOrdersCount(newOrders.length);

      setOrders(sortedOrders);
    } catch (e: any) {
      console.error('Failed to load orders:', e);
      setError(e.message || 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    loadOrders();
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, [filter, statusFilter, autoRefresh]);

  async function updateOrderStatus(orderId: string, newStatus: KitchenStatus) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/kitchen/orders/${orderId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (!res.ok) {
        throw new Error('Failed to update order status');
      }

      // Update local state immediately for instant UI feedback
      setOrders(prev => {
        const updated = prev.map(order =>
          order._id === orderId
            ? { ...order, kitchenStatus: newStatus }
            : order
        );
        
        // Re-sort after status change
        return updated.sort((a, b) => {
          if (a.kitchenStatus === 'NEW' && b.kitchenStatus === 'NEW') {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          } else {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          }
        });
      });

    } catch (e: any) {
      console.error('Failed to update status:', e);
      setError(e.message || 'Failed to update status');
    }
  }

  const getNextStatus = (current: KitchenStatus): KitchenStatus | null => {
    const flow: Record<KitchenStatus, KitchenStatus | null> = {
      NEW: 'PREPARING',
      PREPARING: 'READY',
      READY: 'SERVED',
      SERVED: null,
    };
    return flow[current];
  };

  const getStatusButtonColor = (status: KitchenStatus) => {
    const colors = {
      NEW: 'bg-blue-600 hover:bg-blue-700',
      PREPARING: 'bg-amber-600 hover:bg-amber-700',
      READY: 'bg-green-600 hover:bg-green-700',
      SERVED: 'bg-slate-600 hover:bg-slate-700',
    };
    return colors[status];
  };

  const filteredOrders = orders.filter(order => {
    if (statusFilter !== 'ALL' && order.kitchenStatus !== statusFilter) return false;
    if (filter !== 'ALL' && order.type !== filter) return false;
    return true;
  });

  // Group orders by status with proper sorting
  const ordersByStatus = {
    NEW: filteredOrders
      .filter(o => o.kitchenStatus === 'NEW')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), // Newest first
    
    PREPARING: filteredOrders
      .filter(o => o.kitchenStatus === 'PREPARING')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()), // Oldest first
    
    READY: filteredOrders
      .filter(o => o.kitchenStatus === 'READY')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()), // Oldest first
    
    SERVED: filteredOrders
      .filter(o => o.kitchenStatus === 'SERVED')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // Newest first for history
      .slice(0, 10), // Only show last 10 served orders
  };

  if (loading) {
    return (
      <div className="h-full w-full px-4 py-4 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
          <p className="text-sm text-slate-400">Loading kitchen orders…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full px-4 py-4 overflow-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kitchen Display</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage and track food preparation orders
          </p>
        </div>

        <div className="flex gap-2">
          <select
            className="h-9 rounded-md border border-slate-700 bg-slate-900/60 px-3 text-sm text-slate-200"
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
          >
            <option value="ALL">All Types</option>
            <option value="DINE_IN">Dine In</option>
            <option value="TAKEAWAY">Takeaway</option>
            <option value="DELIVERY">Delivery</option>
          </select>

          <select
            className="h-9 rounded-md border border-slate-700 bg-slate-900/60 px-3 text-sm text-slate-200"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as KitchenStatus | 'ALL')}
          >
            <option value="ALL">All Status</option>
            <option value="NEW">New</option>
            <option value="PREPARING">Preparing</option>
            <option value="READY">Ready</option>
            <option value="SERVED">Served</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={loadOrders}
            disabled={refreshing}
          >
            {refreshing ? (
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Refreshing...
              </span>
            ) : (
              'Refresh'
            )}
          </Button>

          <label className="flex items-center gap-2 cursor-pointer ml-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
            />
            <span className="text-xs text-slate-400">Auto-refresh (10s)</span>
          </label>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm text-rose-400 bg-rose-950/40 border border-rose-900 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* NEW Column */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 sticky top-0 bg-slate-950/90 py-2 z-10">
            <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></span>
            <h2 className="font-semibold">New Orders</h2>
            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full">
              {ordersByStatus.NEW.length}
            </span>
          </div>
          <div className="space-y-3">
            {ordersByStatus.NEW.map(order => (
              <div key={order._id} className="animate-slideIn">
                <KitchenOrderCard
                  order={order}
                  onUpdateStatus={updateOrderStatus}
                  getNextStatus={getNextStatus}
                  getStatusButtonColor={getStatusButtonColor}
                  formatTime={formatTime}
                />
              </div>
            ))}
            {ordersByStatus.NEW.length === 0 && (
              <div className="text-center py-8 text-sm text-slate-500 border border-dashed border-slate-800 rounded-lg">
                No new orders
              </div>
            )}
          </div>
        </div>

        {/* PREPARING Column */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 sticky top-0 bg-slate-950/90 py-2 z-10">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <h2 className="font-semibold">Preparing</h2>
            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full">
              {ordersByStatus.PREPARING.length}
            </span>
          </div>
          <div className="space-y-3">
            {ordersByStatus.PREPARING.map(order => (
              <KitchenOrderCard
                key={order._id}
                order={order}
                onUpdateStatus={updateOrderStatus}
                getNextStatus={getNextStatus}
                getStatusButtonColor={getStatusButtonColor}
                formatTime={formatTime}
              />
            ))}
            {ordersByStatus.PREPARING.length === 0 && (
              <div className="text-center py-8 text-sm text-slate-500 border border-dashed border-slate-800 rounded-lg">
                No orders in preparation
              </div>
            )}
          </div>
        </div>

        {/* READY Column */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 sticky top-0 bg-slate-950/90 py-2 z-10">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <h2 className="font-semibold">Ready to Serve</h2>
            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full">
              {ordersByStatus.READY.length}
            </span>
          </div>
          <div className="space-y-3">
            {ordersByStatus.READY.map(order => (
              <KitchenOrderCard
                key={order._id}
                order={order}
                onUpdateStatus={updateOrderStatus}
                getNextStatus={getNextStatus}
                getStatusButtonColor={getStatusButtonColor}
                formatTime={formatTime}
              />
            ))}
            {ordersByStatus.READY.length === 0 && (
              <div className="text-center py-8 text-sm text-slate-500 border border-dashed border-slate-800 rounded-lg">
                No ready orders
              </div>
            )}
          </div>
        </div>

        {/* SERVED Column */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 sticky top-0 bg-slate-950/90 py-2 z-10">
            <span className="w-3 h-3 rounded-full bg-slate-500"></span>
            <h2 className="font-semibold">Recently Served</h2>
            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full">
              {ordersByStatus.SERVED.length}
            </span>
          </div>
          <div className="space-y-3">
            {ordersByStatus.SERVED.map(order => (
              <KitchenOrderCard
                key={order._id}
                order={order}
                onUpdateStatus={updateOrderStatus}
                getNextStatus={getNextStatus}
                getStatusButtonColor={getStatusButtonColor}
                formatTime={formatTime}
                isServed
              />
            ))}
            {ordersByStatus.SERVED.length === 0 && (
              <div className="text-center py-8 text-sm text-slate-500 border border-dashed border-slate-800 rounded-lg">
                No served orders
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// KitchenOrderCard component (same as before)
function KitchenOrderCard({ 
  order, 
  onUpdateStatus, 
  getNextStatus, 
  getStatusButtonColor,
  formatTime,
  isServed = false 
}: { 
  order: KitchenOrder;
  onUpdateStatus: (id: string, status: KitchenStatus) => void;
  getNextStatus: (current: KitchenStatus) => KitchenStatus | null;
  getStatusButtonColor: (status: KitchenStatus) => string;
  formatTime: (date: string) => string;
  isServed?: boolean;
}) {
  const nextStatus = getNextStatus(order.kitchenStatus);

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-3 hover:border-slate-700 transition-colors">
      {/* Order Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium">
            #{order.reference || order._id.slice(-6)}
          </span>
          <span className="ml-2 text-[10px] text-slate-500">
            {formatTime(order.createdAt)}
          </span>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${getStatusColor(order.kitchenStatus)}`}>
          {getStatusIcon(order.kitchenStatus)}
          {order.kitchenStatus}
        </span>
      </div>

      {/* Order Info */}
      <div className="flex items-center gap-2 text-xs flex-wrap">
        <span className="bg-slate-800 px-2 py-0.5 rounded-full">
          {order.type}
        </span>
        {order.table && (
          <span className="bg-slate-800 px-2 py-0.5 rounded-full">
            Table {order.table.name}
            {order.table.area && ` · ${order.table.area}`}
          </span>
        )}
      </div>

      {/* Items */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {order.items.map(item => (
          <div key={item._id} className="text-sm border-b border-slate-800/60 pb-2 last:border-0">
            <div className="flex justify-between">
              <span className="font-medium text-emerald-400">{item.quantity}x</span>
              <span className="flex-1 ml-2">{item.product.name}</span>
            </div>
            {item.product.sku && (
              <div className="text-[10px] text-slate-500 ml-6">
                SKU: {item.product.sku}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="text-xs text-amber-400 bg-amber-950/20 border border-amber-900/30 rounded-md px-2 py-1">
          📝 {order.notes}
        </div>
      )}

      {/* Action Button */}
      {!isServed && nextStatus && (
        <Button
          size="sm"
          className={`w-full h-8 text-xs ${getStatusButtonColor(nextStatus)}`}
          onClick={() => onUpdateStatus(order._id, nextStatus)}
        >
          Mark as {nextStatus}
        </Button>
      )}
    </div>
  );
}

