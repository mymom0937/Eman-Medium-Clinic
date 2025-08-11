import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/config/database';
import { auth, currentUser } from '@clerk/nextjs/server';
import { USER_ROLES } from '@/constants/user-roles';

// GET /api/sales/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectToDatabase();
    const { Sale } = await import('@/models/sale');
    const { id } = await params;
    const sale = await Sale.findById(id);
    if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: sale });
  } catch (err) {
    console.error('Error fetching sale:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/sales/[id] - void sale and restock
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await currentUser();
    const role = (user?.publicMetadata?.role as string) || '';
    if (role !== USER_ROLES.PHARMACIST && role !== USER_ROLES.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { action } = body;
    if (action !== 'VOID') {
      return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
    }

    await connectToDatabase();
    const { Sale } = await import('@/models/sale');
    const Drug = (await import('@/models/drug')).default;
    const sale = await Sale.findById(id);
    if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 });

    // Restock items
    for (const item of sale.items) {
      await Drug.findByIdAndUpdate(item.drugId, { $inc: { stockQuantity: item.quantity } });
    }

    await Sale.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Sale voided and items restocked' });
  } catch (err) {
    console.error('Error voiding sale:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/sales/[id] - Update sale items and basic info with stock adjustments
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await currentUser();
    const role = (user?.publicMetadata?.role as string) || '';
    if (role !== USER_ROLES.PHARMACIST && role !== USER_ROLES.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { patientName, paymentMethod, paymentStatus, items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
    }

    await connectToDatabase();
    const { Sale } = await import('@/models/sale');
    const Drug = (await import('@/models/drug')).default;

    const sale = await Sale.findById(id);
    if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 });

    // Build current quantities map
    const currentMap = new Map<string, number>();
    for (const it of sale.items) {
      currentMap.set(String(it.drugId), (currentMap.get(String(it.drugId)) || 0) + Number(it.quantity));
    }
    // Build new quantities map and enrich items for save
    const enrichedItems: any[] = [];
    const newMap = new Map<string, number>();
    for (const it of items) {
      const { drugId, quantity } = it;
      if (!drugId || !quantity || quantity <= 0) {
        return NextResponse.json({ error: 'Invalid item payload' }, { status: 400 });
      }
      const drug = await Drug.findById(drugId);
      if (!drug) return NextResponse.json({ error: `Drug not found: ${drugId}` }, { status: 404 });
      const unitPrice = it.unitPrice != null ? Number(it.unitPrice) : Number(drug.sellingPrice);
      const totalPrice = unitPrice * quantity;
      enrichedItems.push({ drugId, drugName: drug.name, quantity, unitPrice, totalPrice });
      newMap.set(String(drugId), (newMap.get(String(drugId)) || 0) + Number(quantity));
    }

    // Compute deltas: new - old per drug
    const allDrugIds = new Set<string>([...Array.from(currentMap.keys()), ...Array.from(newMap.keys())]);
    const deltas: Array<{ id: string; delta: number; name?: string }> = [];
    for (const idKey of allDrugIds) {
      const oldQ = currentMap.get(idKey) || 0;
      const newQ = newMap.get(idKey) || 0;
      const delta = newQ - oldQ;
      if (delta !== 0) deltas.push({ id: idKey, delta });
    }

    // Apply stock changes transactionally (best-effort without session)
    const applied: Array<{ id: string; qty: number }> = [];
    try {
      for (const ch of deltas) {
        if (ch.delta > 0) {
          const updated = await Drug.findOneAndUpdate(
            { _id: ch.id, stockQuantity: { $gte: ch.delta } },
            { $inc: { stockQuantity: -ch.delta } },
            { new: true }
          );
          if (!updated) throw new Error('Insufficient stock for an item update');
          applied.push({ id: ch.id, qty: ch.delta });
        } else if (ch.delta < 0) {
          await Drug.findByIdAndUpdate(ch.id, { $inc: { stockQuantity: -ch.delta } });
        }
      }
    } catch (err: any) {
      // rollback decrements
      for (const r of applied) {
        try { await Drug.findByIdAndUpdate(r.id, { $inc: { stockQuantity: r.qty } }); } catch {}
      }
      throw err;
    }

    const subtotal = enrichedItems.reduce((s, i) => s + i.totalPrice, 0);
    const total = subtotal; // no discount/tax in current flow

    sale.items = enrichedItems as any;
    if (patientName !== undefined) sale.patientName = patientName;
    if (paymentMethod) sale.paymentMethod = paymentMethod;
    if (paymentStatus) sale.paymentStatus = paymentStatus;
    (sale as any).subtotal = subtotal;
    (sale as any).total = total;
    await sale.save();

    return NextResponse.json({ success: true, data: sale });
  } catch (err: any) {
    console.error('Error updating sale:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}


