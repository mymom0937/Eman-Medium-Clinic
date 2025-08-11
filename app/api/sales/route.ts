import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/config/database';
import { auth, currentUser } from '@clerk/nextjs/server';
import { USER_ROLES } from '@/constants/user-roles';
import { generateSaleId } from '@/utils/utils';

// GET /api/sales - list sales
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const { Sale } = await import('@/models/sale');

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const query: any = {};
    if (q) {
      query.$or = [
        { saleId: { $regex: q, $options: 'i' } },
        { patientName: { $regex: q, $options: 'i' } },
      ];
    }
    const sales = await Sale.find(query).sort({ createdAt: -1 }).lean();
    // Backward-compat normalization for legacy sales that used totalAmount/finalAmount fields
    const normalized = (sales as any[]).map((s: any) => ({
      ...s,
      total: Number(s.total ?? s.finalAmount ?? s.totalAmount ?? 0),
      createdAt: s.createdAt || s.soldAt || s.date || null,
    }));
    return NextResponse.json({ success: true, data: normalized });
  } catch (err) {
    console.error('Error fetching sales:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/sales - create sale with stock decrement
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // verify role
    const user = await currentUser();
    let role = user?.publicMetadata?.role as string | undefined;
    if (!role) {
      await connectToDatabase();
      const User = (await import('@/models/user')).default;
      const dbUser = await User.findOne({ clerkId: userId });
      role = dbUser?.role;
    }
    if (role !== USER_ROLES.PHARMACIST && role !== USER_ROLES.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      source = 'OTC',
      externalRef,
      drugOrderId,
      patientName,
      patientPhone,
      items,
      discount = 0,
      tax = 0,
      paymentMethod,
      paymentStatus = 'PAID',
    } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
    }
    if (!paymentMethod) {
      return NextResponse.json({ error: 'Payment method is required' }, { status: 400 });
    }

    await connectToDatabase();
    const { Sale } = await import('@/models/sale');
    const Drug = (await import('@/models/drug')).default;

    // Validate stock and compute pricing
    const enrichedItems = [] as Array<{ drugId: string; drugName: string; quantity: number; unitPrice: number; totalPrice: number }>;
    for (const it of items) {
      const { drugId, quantity } = it;
      if (!drugId || !quantity || quantity <= 0) {
        return NextResponse.json({ error: 'Invalid item payload' }, { status: 400 });
      }
      const drug = await Drug.findById(drugId);
      if (!drug) {
        return NextResponse.json({ error: `Drug not found: ${drugId}` }, { status: 404 });
      }
      if (drug.stockQuantity < quantity) {
        return NextResponse.json({ error: `Insufficient stock for ${drug.name}. Available: ${drug.stockQuantity}` }, { status: 400 });
      }
      const unitPrice = it.unitPrice != null ? Number(it.unitPrice) : Number(drug.sellingPrice);
      const totalPrice = unitPrice * quantity;
      enrichedItems.push({ drugId, drugName: drug.name, quantity, unitPrice, totalPrice });
    }

    const subtotal = enrichedItems.reduce((s, i) => s + i.totalPrice, 0);
    const total = Math.max(0, subtotal - Number(discount || 0) + Number(tax || 0));

    const saleId = await generateSaleId();

    // Atomic-ish update: decrement stocks sequentially, rollback on failure
    const decremented: Array<{ id: string; qty: number }> = [];
    try {
      for (const it of enrichedItems) {
        const updated = await Drug.findOneAndUpdate(
          { _id: it.drugId, stockQuantity: { $gte: it.quantity } },
          { $inc: { stockQuantity: -it.quantity } },
          { new: true }
        );
        if (!updated) {
          throw new Error(`Stock changed for item; cannot fulfill ${it.drugName}`);
        }
        decremented.push({ id: it.drugId, qty: it.quantity });
      }

      const saved = await Sale.create({
        saleId,
        source,
        externalRef,
        drugOrderId,
        patientName,
        patientPhone,
        items: enrichedItems,
        subtotal,
        discount: Number(discount || 0),
        tax: Number(tax || 0),
        total,
        paymentMethod,
        paymentStatus,
        recordedBy: userId,
      });

      return NextResponse.json({ success: true, data: saved }, { status: 201 });
    } catch (err: any) {
      // rollback
      for (const r of decremented) {
        try {
          await Drug.findByIdAndUpdate(r.id, { $inc: { stockQuantity: r.qty } });
        } catch {}
      }
      console.error('Error creating sale:', err);
      return NextResponse.json({ error: err?.message || 'Failed to create sale' }, { status: 500 });
    }
  } catch (err) {
    console.error('Error creating sale:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/sales - Danger: purge sales (admin only)
// Supports:
//   - ?all=true → delete all
//   - ?days=N   → delete sales created before now-N days
//   - ?before=ISO_DATE → delete sales created before given date
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await currentUser();
    const role = (user?.publicMetadata?.role as string) || '';
    if (role !== USER_ROLES.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden - Admins only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';
    const days = searchParams.get('days');
    const before = searchParams.get('before');

    await connectToDatabase();
    const { Sale } = await import('@/models/sale');

    let query: any = {};
    if (!all) {
      let cutoff: Date | null = null;
      if (days) {
        const n = parseInt(days);
        if (!isNaN(n) && n > 0) {
          cutoff = new Date(Date.now() - n * 24 * 60 * 60 * 1000);
        }
      }
      if (!cutoff && before) {
        const d = new Date(before);
        if (!isNaN(d.getTime())) cutoff = d;
      }
      if (!cutoff) {
        return NextResponse.json({ error: 'Specify ?all=true or ?days=N or ?before=ISO_DATE' }, { status: 400 });
      }
      query = { createdAt: { $lt: cutoff } };
    }

    const res = await Sale.deleteMany(query);
    return NextResponse.json({ success: true, deletedCount: res.deletedCount });
  } catch (err) {
    console.error('Error purging sales:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


