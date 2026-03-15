// client/lib/pos.ts
export type PosCartItem = {
  productId: string;
  name: string;
  sku?: string;
  unitPrice: number;
  quantity: number;
  discountAmount?: number;
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
};

export async function createPosSale(payload: CreatePosSalePayload) {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('accessToken')
      : null;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/pos/sales`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    },
  );

  let data: any = {};
  try {
    data = await res.json();
  } catch {
    // ignore
  }

  console.log('POS sale response', res.status, data);

  if (!res.ok) {
    throw new Error(data.error || 'Failed to create POS sale');
  }
  return data; // { sale, items }
}
