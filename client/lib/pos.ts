// client/lib/pos.ts
import { authHeaders } from './apiClient';

export type PosCartItem = {
  productId: string;
  name: string;
  sku?: string;
  unitPrice: number;
  quantity: number;
  discountAmount?: number;
  taxRate?: number;
};

export type CreatePosSalePayload = {
  customerId?: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    discountAmount?: number;
  }[];
  paidAmount: number;
  reference?: string;
  status?: 'OPEN' | 'COMPLETED' | 'VOID';

  // restaurant fields
  type?: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  tableId?: string;
  covers?: number;
  notes?: string;
};

export type UpdatePosSalePayload = {
  status?: 'OPEN' | 'COMPLETED' | 'VOID';
  paidAmount?: number;
  reference?: string;
  type?: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  covers?: number;
  notes?: string;
};

export type PosSaleResponse = {
  sale: {
    _id: string;
    reference?: string;
    subtotal: number;
    taxTotal: number;
    discountTotal: number;
    grandTotal: number;
    paidAmount: number;
    balance: number;
    status: 'OPEN' | 'COMPLETED' | 'VOID';
    type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
    table?: {
      _id: string;
      name: string;
    };
    covers?: number;
    notes?: string;
    createdAt: string;
    customer?: {
      _id: string;
      name?: string;
    };
    user?: {
      _id: string;
      name?: string;
      email?: string;
    };
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
    discountAmount: number;
    lineTotal: number;
    taxAmount?: number;
  }>;
};

/**
 * Create a new POS sale (OPEN or COMPLETED)
 */
export async function createPosSale(payload: CreatePosSalePayload): Promise<PosSaleResponse> {
  try {
    const headers = authHeaders();
    
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sales`,
      {
        method: 'POST',
        headers: headers as HeadersInit,
        body: JSON.stringify(payload),
      },
    );

    let data: any = {};
    try {
      data = await res.json();
    } catch {
      // ignore parse error
    }

    console.log('POS sale response', res.status, data);
    
    if (!res.ok) {
      throw new Error(data.error || data.message || 'Failed to create POS sale');
    }
    
    return data as PosSaleResponse;
  } catch (error) {
    console.error('Error creating POS sale:', error);
    throw error;
  }
}

/**
 * Update an existing POS sale (e.g., modify, change status)
 */
export async function updatePosSale(
  saleId: string,
  payload: UpdatePosSalePayload
): Promise<PosSaleResponse> {
  if (!saleId) {
    throw new Error('Sale ID is required');
  }

  try {
    const headers = authHeaders();
    
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sales/${saleId}`,
      {
        method: 'PATCH',
        headers: headers as HeadersInit,
        body: JSON.stringify(payload),
      },
    );

    let data: any = {};
    try {
      data = await res.json();
    } catch {
      // ignore parse error
    }

    console.log('POS update response', res.status, data);
    
    if (!res.ok) {
      throw new Error(data.error || data.message || 'Failed to update POS sale');
    }
    
    return data as PosSaleResponse;
  } catch (error) {
    console.error('Error updating POS sale:', error);
    throw error;
  }
}

/**
 * Complete payment for an open order
 * Uses the dedicated /complete endpoint
 */
export async function completePosSalePayment(
  saleId: string,
  paidAmount: number
): Promise<PosSaleResponse> {
  if (!saleId) {
    throw new Error('Sale ID is required');
  }

  try {
    const headers = authHeaders();
    
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sales/${saleId}/complete`,
      {
        method: 'POST',
        headers: headers as HeadersInit,
        body: JSON.stringify({ paidAmount }),
      },
    );

    let data: any = {};
    try {
      data = await res.json();
    } catch {
      // ignore parse error
    }

    console.log('POS complete payment response', res.status, data);
    
    if (!res.ok) {
      throw new Error(data.error || data.message || 'Failed to complete payment');
    }
    
    // Ensure consistent response format
    if (data.sale && Array.isArray(data.items)) {
      return data as PosSaleResponse;
    } else if (data._id) {
      // If API returns just the sale object, fetch the full sale with items
      try {
        const fullSale = await getPosSale(saleId);
        return fullSale;
      } catch {
        return {
          sale: data,
          items: []
        } as PosSaleResponse;
      }
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error completing payment:', error);
    throw error;
  }
}

/**
 * Void a sale (cancel/refund)
 * Uses the dedicated /void endpoint
 */
export async function voidPosSale(saleId: string): Promise<PosSaleResponse> {
  if (!saleId) {
    throw new Error('Sale ID is required');
  }

  try {
    const headers = authHeaders();
    
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sales/${saleId}/void`,
      {
        method: 'POST',
        headers: headers as HeadersInit,
      },
    );

    let data: any = {};
    try {
      data = await res.json();
    } catch {
      // ignore parse error
    }

    console.log('POS void response', res.status, data);
    
    if (!res.ok) {
      throw new Error(data.error || data.message || 'Failed to void sale');
    }
    
    // Ensure consistent response format
    if (data.sale && Array.isArray(data.items)) {
      return data as PosSaleResponse;
    } else if (data._id) {
      // If API returns just the sale object, fetch the full sale
      try {
        const fullSale = await getPosSale(saleId);
        return fullSale;
      } catch {
        return {
          sale: data,
          items: []
        } as PosSaleResponse;
      }
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error voiding sale:', error);
    throw error;
  }
}

/**
 * Get a single POS sale by ID
 */
export async function getPosSale(saleId: string): Promise<PosSaleResponse> {
  if (!saleId) {
    throw new Error('Sale ID is required');
  }

  try {
    const headers = authHeaders();
    
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sales/${saleId}`,
      {
        headers: headers as HeadersInit,
      },
    );

    let data: any = {};
    try {
      data = await res.json();
    } catch {
      // ignore parse error
    }

    console.log('POS get sale response', res.status, data);
    
    if (!res.ok) {
      throw new Error(data.error || data.message || 'Failed to fetch POS sale');
    }
    
    // Handle different response formats
    if (data.sale && Array.isArray(data.items)) {
      return data as PosSaleResponse;
    } else if (data._id) {
      // If API returns just the sale object
      return {
        sale: data,
        items: data.items || []
      } as PosSaleResponse;
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error fetching POS sale:', error);
    throw error;
  }
}

/**
 * Reopen a completed/voided sale (if needed)
 */
export async function reopenPosSale(saleId: string): Promise<PosSaleResponse> {
  return updatePosSale(saleId, { status: 'OPEN' });
}