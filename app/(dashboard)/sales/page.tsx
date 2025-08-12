"use client";

import React, { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useUserRole } from "@/hooks/useUserRole";
import { PageLoader } from "@/components/common/loading-spinner";
import { Modal } from "@/components/ui/modal";
import { FormField, Input, Select, TextArea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { USER_ROLES } from "@/constants/user-roles";
import { toastManager } from "@/lib/utils/toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FaEye, FaTrash, FaEdit } from "react-icons/fa";
import { StatsCard } from "@/components/dashboard/stats-card";
import { PaginationControls } from "@/components/ui/pagination";

interface Drug { _id: string; name: string; sellingPrice: number; stockQuantity: number; strength: string; dosageForm: string; }
interface SaleItemDraft { drugId: string; drugName: string; quantity: number; unitPrice: number; totalPrice: number; stock?: number; }
interface SaleRecord { _id: string; saleId: string; total: number; paymentMethod: string; createdAt: string; patientName?: string; items: SaleItemDraft[]; source: string; }

export default function SalesPage() {
  const { userRole, userName, isLoaded } = useUserRole();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isLgUp, setIsLgUp] = useState(false);
  const [viewing, setViewing] = useState<SaleRecord | null>(null);
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<SaleRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  // Date range controls for stats
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [rangeStart, setRangeStart] = useState<string>('');
  const [rangeEnd, setRangeEnd] = useState<string>('');

  const [source, setSource] = useState<'EXTERNAL_PRESCRIPTION' | 'OTC' | 'ORDER'>('EXTERNAL_PRESCRIPTION');
  const [patientName, setPatientName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'CASH'|'CARD'|'MOBILE_MONEY'>("CASH");
  // Removed discount and tax per request – totals are now simple subtotal = sum(items)
  const [items, setItems] = useState<SaleItemDraft[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!isLoaded) return;
      try {
        setInitialLoading(true);
        const [drugsRes, salesRes] = await Promise.all([
          fetch('/api/drugs?limit=1000&page=1'),
          fetch('/api/sales')
        ]);
        const drugsJson = await drugsRes.json().catch(()=>({}));
        const salesJson = await salesRes.json().catch(()=>({}));
        if (drugsRes.ok && drugsJson.success) setDrugs(drugsJson.data || []);
        if (salesRes.ok && salesJson.success) setSales(salesJson.data || []);
      } finally {
        setInitialLoading(false);
      }
    };
    load();
  }, [isLoaded]);

  // Responsive breakpoint listener (lg: 1024px)
  useEffect(() => {
    const compute = () => {
      if (typeof window === 'undefined') return;
      setIsLgUp(window.innerWidth >= 1024);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  const addItem = () => setItems(prev => [...prev, { drugId: "", drugName: "", quantity: 1, unitPrice: 0, totalPrice: 0 }]);
  const removeItem = (idx: number) => setItems(prev => prev.filter((_,i)=>i!==idx));
  const updateItem = (idx: number, field: keyof SaleItemDraft, value: any) => {
    setItems(prev => {
      const copy = [...prev];
      const it = { ...copy[idx], [field]: value } as SaleItemDraft;
      if (field === 'drugId') {
        const d = drugs.find(dr => dr._id === value);
        it.drugName = d?.name || "";
        // Do not auto-assign unit price; keep manual entry
        it.stock = d?.stockQuantity ?? 0;
        // Clamp quantity to available stock if necessary
        if (d && typeof it.quantity === 'number' && it.quantity > (d.stockQuantity ?? 0)) {
          toastManager.info('Quantity reduced to available stock');
          it.quantity = d.stockQuantity ?? 0;
        }
      }
      if (field === 'quantity') {
        const d = drugs.find(dr => dr._id === it.drugId);
        if (d && typeof value === 'number' && value > (d.stockQuantity ?? 0)) {
          toastManager.error('Requested quantity exceeds available stock');
          it.quantity = d.stockQuantity ?? 0;
        }
      }
      if (field === 'quantity' || field === 'unitPrice' || field === 'drugId') {
        it.totalPrice = Number(it.quantity || 0) * Number(it.unitPrice || 0);
      }
      copy[idx] = it;
      return copy;
    });
  };

  const subtotal = useMemo(() => items.reduce((s,i)=>s+Number(i.totalPrice||0),0), [items]);
  const grandTotal = useMemo(() => subtotal, [subtotal]);

  // Derived data: search + pagination
  const filteredSales = useMemo(() => (sales || []).filter(s =>
    (s.saleId?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (s.patientName?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  ), [sales, searchTerm]);

  useEffect(() => { setPage(1); }, [searchTerm]);

  const paginatedSales = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSales.slice(start, start + pageSize);
  }, [filteredSales, page]);

  // Helper for date bounds
  const rangeBounds = useMemo(() => {
    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = null;
    switch (dateRange) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'week': {
        const ws = new Date(now);
        ws.setDate(now.getDate() - now.getDay());
        start = new Date(ws.getFullYear(), ws.getMonth(), ws.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      }
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        break;
      case 'custom':
        if (rangeStart) start = new Date(rangeStart);
        if (rangeEnd) end = new Date(rangeEnd);
        break;
    }
    return { start, end };
  }, [dateRange, rangeStart, rangeEnd]);

  // Stats based on range
  const stats = useMemo(() => {
    const { start, end } = rangeBounds;
    const within = (d: any) => {
      const dt = new Date(d);
      return (!start || dt >= start) && (!end || dt <= end);
    };
    const inRange = sales.filter((s:any) => within(s.createdAt));
    const totalSales = inRange.length;
    const totalRevenue = inRange.reduce((sum:any, s:any) => sum + Number(s.total || 0), 0);
    return {
      totalSales,
      todaySales: totalSales,
      totalRevenue,
      todayRevenue: totalRevenue,
    };
  }, [sales, rangeBounds]);

  const resetForm = () => {
    setSource('OTC');
    setPatientName("");
    setPaymentMethod('CASH');
    setItems([]);
  };

  const submitSale = async () => {
    if (items.length === 0) { toastManager.error('Add at least one item'); return; }
    if (items.some(i => !i.drugId || !i.quantity || i.quantity <= 0 || !i.unitPrice || i.unitPrice <= 0)) { toastManager.error('Complete all item fields'); return; }
    setLoading(true);
    try {
      const payload = {
        source,
        patientName: patientName || undefined,
        items: items.map(i => ({ drugId: i.drugId, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })),
        paymentMethod,
        paymentStatus: 'PAID',
      };
      const res = await fetch('/api/sales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create sale');
      toastManager.success('Sale recorded successfully');
      setIsAddOpen(false); resetForm();
      // reload sales
      const sres = await fetch('/api/sales');
      const sjson = await sres.json();
      if (sres.ok && sjson.success) setSales(sjson.data || []);
      // reload drugs to update stock
      const dres = await fetch('/api/drugs');
      const djson = await dres.json();
      if (dres.ok && djson.success) setDrugs(djson.data || []);
    } catch (err: any) {
      toastManager.error(err?.message || 'Failed to create sale');
    } finally { setLoading(false); }
  };

  if (!isLoaded || initialLoading) {
    return (
      <DashboardLayout title="Sales" userRole={userRole} userName={userName}>
        <div className="flex items-center justify-center h-[60vh]"><PageLoader text="Loading sales..." /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Sales" userRole={userRole} userName={userName}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-text-primary">Pharmacy Sales</h1>
          {(userRole === USER_ROLES.PHARMACIST || userRole === USER_ROLES.SUPER_ADMIN) && (
            <Button onClick={() => setIsAddOpen(true)} className="bg-[#1447E6] text-white">New Sale</Button>
          )}
        </div>

        {/* Stats Controls + Cards */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-text-secondary">Summary</div>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={dateRange}
                onChange={(e)=>setDateRange(e.target.value as any)}
                className="w-full sm:w-auto border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background"
              >
                <option value="today">Today</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
                <option value="year">This year</option>
                <option value="custom">Custom</option>
              </select>
              {dateRange === 'custom' && (
                <div className="flex gap-3">
                  <input type="date" value={rangeStart} onChange={(e)=>setRangeStart(e.target.value)} className="border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background" />
                  <input type="date" value={rangeEnd} onChange={(e)=>setRangeEnd(e.target.value)} className="border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background" />
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <StatsCard title="Total Sales" value={String(stats.totalSales)} change={dateRange==='custom'?undefined:'compared to last '+dateRange} changeType="neutral" icon="🧾" />
            <StatsCard title="Range Sales" value={String(stats.todaySales)} change={dateRange==='custom'?undefined:'compared to last '+dateRange} changeType="neutral" icon="📅" />
            <StatsCard title="Revenue" value={`EBR ${stats.totalRevenue.toFixed(2)}`} change={dateRange==='custom'?undefined:'compared to last '+dateRange} changeType="positive" icon="💰" />
            <StatsCard title="Range Revenue" value={`EBR ${stats.todayRevenue.toFixed(2)}`} change={dateRange==='custom'?undefined:'compared to last '+dateRange} changeType="positive" icon="📈" />
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by sale ID or patient name..."
            value={searchTerm}
            onChange={(e)=>setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-border-color rounded-md focus:outline-none focus:ring-2 focus:ring-accent-color focus:border-transparent text-text-primary placeholder-text-muted bg-background"
          />
        </div>

        {isLgUp ? (
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-card-bg">
                <TableHead className="px-4 py-2">Sale ID</TableHead>
                <TableHead className="px-4 py-2">Patient</TableHead>
                <TableHead className="px-4 py-2">Items</TableHead>
                <TableHead className="px-4 py-2">Total</TableHead>
                <TableHead className="px-4 py-2">Payment</TableHead>
                <TableHead className="px-4 py-2">Date</TableHead>
                <TableHead className="px-4 py-2">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSales.map(s => (
                <TableRow key={s._id} className="border-b border-border-color">
                  <TableCell className="px-4 py-2">{s.saleId}</TableCell>
                  <TableCell className="px-4 py-2">{s.patientName || 'N/A'}</TableCell>
                  <TableCell className="px-4 py-2">{(s.items || []).length} item(s)</TableCell>
                  <TableCell className="px-4 py-2">EBR {Number((s as any).total || 0).toFixed(2)}</TableCell>
                  <TableCell className="px-4 py-2">{s.paymentMethod}</TableCell>
                  <TableCell className="px-4 py-2">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '-'}</TableCell>
                  <TableCell className="px-4 py-2 whitespace-nowrap text-xs sm:text-sm font-medium">
                    <button
                      onClick={() => setViewing(s)}
                      className="text-blue-600 hover:text-blue-400 mr-3 p-1 rounded hover:bg-blue-900/20 transition-colors cursor-pointer"
                      title="View"
                    >
                      <FaEye size={16} />
                    </button>
                    {(userRole === USER_ROLES.PHARMACIST || userRole === USER_ROLES.SUPER_ADMIN) && (
                      <button
                        onClick={() => setEditing(s)}
                        className="text-green-600 hover:text-green-400 mr-3 p-1 rounded hover:bg-green-900/20 transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <FaEdit size={16} />
                      </button>
                    )}
                    {(userRole === USER_ROLES.PHARMACIST || userRole === USER_ROLES.SUPER_ADMIN) && (
                      <button
                        onClick={async () => {
                          if (!confirm('Void this sale and restock items?')) return;
                          setVoidingId(s._id);
                          try {
                            const res = await fetch(`/api/sales/${s._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'VOID' }) });
                            const j = await res.json().catch(()=>({}));
                            if (!res.ok) throw new Error(j.error || 'Failed to void sale');
                            toastManager.success('Sale voided and items restocked');
                            const [sr, dr] = await Promise.all([fetch('/api/sales'), fetch('/api/drugs')]);
                            const sj = await sr.json().catch(()=>({}));
                            const dj = await dr.json().catch(()=>({}));
                            if (sr.ok && sj.success) setSales(sj.data || []);
                            if (dr.ok && dj.success) setDrugs(dj.data || []);
                          } catch (err: any) {
                            toastManager.error(err?.message || 'Failed to void sale');
                          } finally {
                            setVoidingId(null);
                          }
                        }}
                        className="text-red-600 hover:text-red-400 p-1 rounded hover:bg-red-900/20 transition-colors cursor-pointer"
                        title="Void Sale"
                        disabled={voidingId === s._id}
                      >
                        <FaTrash size={16} />
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="space-y-3">
            {paginatedSales.map(s => (
              <div key={s._id} className="border border-border-color rounded-lg p-3 bg-card-bg overflow-hidden">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-text-primary break-words">{s.saleId}</div>
                    <div className="text-sm text-text-secondary break-words">{s.patientName || 'N/A'}</div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <button onClick={()=>setViewing(s)} className="text-blue-600 hover:text-blue-400 p-1 rounded hover:bg-blue-900/20"><FaEye size={16} /></button>
                    {(userRole === USER_ROLES.PHARMACIST || userRole === USER_ROLES.SUPER_ADMIN) && (
                      <button onClick={()=>setEditing(s)} className="text-green-600 hover:text-green-400 p-1 rounded hover:bg-green-900/20"><FaEdit size={16} /></button>
                    )}
                    {(userRole === USER_ROLES.PHARMACIST || userRole === USER_ROLES.SUPER_ADMIN) && (
                      <button onClick={async()=>{
                        if (!confirm('Void this sale and restock items?')) return;
                        setVoidingId(s._id);
                        try {
                          const res = await fetch(`/api/sales/${s._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'VOID' }) });
                          const j = await res.json().catch(()=>({}));
                          if (!res.ok) throw new Error(j.error || 'Failed to void sale');
                          toastManager.success('Sale voided and items restocked');
                          const [sr, dr] = await Promise.all([fetch('/api/sales'), fetch('/api/drugs')]);
                          const sj = await sr.json().catch(()=>({}));
                          const dj = await dr.json().catch(()=>({}));
                          if (sr.ok && sj.success) setSales(sj.data || []);
                          if (dr.ok && dj.success) setDrugs(dj.data || []);
                        } catch (err:any) { toastManager.error(err?.message || 'Failed to void sale'); } finally { setVoidingId(null); }
                      }} className="text-red-600 hover:text-red-400 p-1 rounded hover:bg-red-900/20" disabled={voidingId===s._id}><FaTrash size={16} /></button>
                    )}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm min-w-0">
                  <div>
                    <span className="text-text-muted">Items:</span>
                    <span className="ml-1 text-text-primary break-words">{(s.items||[]).length}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Total:</span>
                    <span className="ml-1 text-text-primary break-words">EBR {Number((s as any).total || 0).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Payment:</span>
                    <span className="ml-1 text-text-primary break-words">{s.paymentMethod}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Date:</span>
                    <span className="ml-1 text-text-primary break-words">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '-'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal isOpen={isAddOpen} onClose={() => { setIsAddOpen(false); resetForm(); }} title="Record New Sale" size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Sale Type">
                <Select
                  value={source}
                  onChange={e=>setSource(e.target.value as any)}
                  options={[{ value: 'EXTERNAL_PRESCRIPTION', label: 'Pharmacy Sale' }]}
                  disabled
                />
              </FormField>
              <FormField label="Patient (optional)">
                <Input value={patientName} onChange={e=>setPatientName(e.target.value)} placeholder="Enter patient name" />
              </FormField>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Items</label>
              {items.map((it, idx) => (
                <div key={idx} className="border border-border-color p-3 rounded mb-3 bg-card-bg grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField label="Drug">
                    <Select value={it.drugId} onChange={e=>updateItem(idx,'drugId', e.target.value)} options={[
                      { value: '', label: 'Select a drug...' },
                      ...drugs.map(d=>({ value: d._id, label: `${d.name} - ${d.strength} (${d.dosageForm})${(userRole === USER_ROLES.PHARMACIST || userRole === USER_ROLES.SUPER_ADMIN) ? ` | Stock: ${d.stockQuantity}` : ''}` }))
                    ]} />
                  </FormField>
                  <FormField label="Unit Price (manual)">
                    <Input type="number" step="0.01" value={it.unitPrice} onChange={e=>updateItem(idx,'unitPrice', parseFloat(e.target.value))} />
                  </FormField>
                  <FormField label="Quantity">
                    <Input type="number" value={it.quantity} min="1" onChange={e=>updateItem(idx,'quantity', parseInt(e.target.value))} />
                  </FormField>
                  <FormField label="Total">
                    <Input type="number" value={it.totalPrice} disabled />
                  </FormField>
                  <div className="md:col-span-2 flex justify-between text-xs text-text-secondary">
                    {(userRole === USER_ROLES.PHARMACIST || userRole === USER_ROLES.SUPER_ADMIN) && (
                      <span>Available: {it.stock ?? '-'}</span>
                    )}
                    <Button variant="destructive" size="sm" onClick={()=>removeItem(idx)}>Remove</Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={addItem}>Add Item</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <FormField label="Payment Method">
                <Select value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value as any)} options={[
                  { value: 'CASH', label: 'Cash' },
                  { value: 'CARD', label: 'Card' },
                  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
                ]} />
              </FormField>
            </div>

            <div className="text-right text-sm">
              <div>Total: <span className="font-semibold">EBR {grandTotal.toFixed(2)}</span></div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={()=>{ setIsAddOpen(false); resetForm(); }}>Cancel</Button>
              <Button onClick={submitSale} loading={loading} className="bg-[#1447E6] text-white">Save Sale</Button>
            </div>
          </div>
        </Modal>

        <PaginationControls
          page={page}
          total={filteredSales.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />

        {/* View Sale Modal */}
        <Modal
          isOpen={!!viewing}
          onClose={() => setViewing(null)}
          title="Sale Details"
          size="lg"
        >
          {viewing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-muted">Sale ID</label>
                  <p className="text-sm text-text-primary">{viewing.saleId}</p>
                </div>
                <div>
                  <label className="block text-sm text-text-muted">Patient</label>
                  <p className="text-sm text-text-primary">{viewing.patientName || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm text-text-muted">Payment</label>
                  <p className="text-sm text-text-primary">{viewing.paymentMethod}</p>
                </div>
                <div>
                  <label className="block text-sm text-text-muted">Date</label>
                  <p className="text-sm text-text-primary">{viewing.createdAt ? new Date(viewing.createdAt).toLocaleString() : '-'}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Items</label>
                <div className="space-y-2">
                  {(viewing.items || []).map((it, i) => (
                    <div key={i} className="border border-border-color p-3 rounded bg-card-bg grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-text-muted">Drug</span>
                        <p className="text-text-primary">{it.drugName}</p>
                      </div>
                      <div>
                        <span className="text-text-muted">Qty</span>
                        <p className="text-text-primary">{it.quantity}</p>
                      </div>
                      <div>
                        <span className="text-text-muted">Unit</span>
                        <p className="text-text-primary">EBR {Number(it.unitPrice).toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-text-muted">Total</span>
                        <p className="text-text-primary">EBR {Number(it.totalPrice).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-right text-sm">
                <div>Total: <span className="font-semibold">EBR {Number((viewing as any).total || 0).toFixed(2)}</span></div>
              </div>

              <div className="flex justify-end">
                <Button variant="secondary" onClick={() => setViewing(null)}>Close</Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Edit Sale Modal */}
        <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Edit Sale" size="lg">
          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Patient (optional)">
                  <Input value={editing.patientName || ''} onChange={e=>setEditing({ ...editing, patientName: e.target.value } as any)} placeholder="Enter patient name" />
                </FormField>
                <FormField label="Payment Method">
                  <Select value={editing.paymentMethod as any} onChange={e=>setEditing({ ...editing, paymentMethod: e.target.value } as any)} options={[
                    { value: 'CASH', label: 'Cash' },
                    { value: 'CARD', label: 'Card' },
                    { value: 'MOBILE_MONEY', label: 'Mobile Money' },
                  ]} />
                </FormField>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Items</label>
                {(editing.items || []).map((it, idx) => (
                  <div key={idx} className="border border-border-color p-3 rounded mb-3 bg-card-bg grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField label="Drug">
                      <Select value={(it as any).drugId} onChange={e=>{
                        const copy = { ...editing } as any; const id = e.target.value; const d = drugs.find(dr=>dr._id===id);
                        copy.items[idx] = { ...copy.items[idx], drugId: id, drugName: d?.name || '', unitPrice: copy.items[idx].unitPrice, quantity: copy.items[idx].quantity, totalPrice: (copy.items[idx].quantity||0) * (copy.items[idx].unitPrice||0) };
                        setEditing(copy);
                      }} options={[{ value: '', label: 'Select a drug...' }, ...drugs.map(d=>({ value: d._id, label: `${d.name} - ${d.strength} (${d.dosageForm}) | Stock: ${d.stockQuantity}` }))]} />
                    </FormField>
                    <FormField label="Unit Price (manual)">
                      <Input type="number" step="0.01" value={(it as any).unitPrice} onChange={e=>{
                        const copy:any = { ...editing }; copy.items[idx] = { ...copy.items[idx], unitPrice: parseFloat(e.target.value||'0') };
                        copy.items[idx].totalPrice = Number(copy.items[idx].unitPrice || 0) * Number(copy.items[idx].quantity || 0);
                        setEditing(copy);
                      }} />
                    </FormField>
                    <FormField label="Quantity">
                      <Input type="number" value={(it as any).quantity} min="1" onChange={e=>{
                        const copy:any = { ...editing }; copy.items[idx] = { ...copy.items[idx], quantity: parseInt(e.target.value||'0') };
                        copy.items[idx].totalPrice = Number(copy.items[idx].unitPrice || 0) * Number(copy.items[idx].quantity || 0);
                        setEditing(copy);
                      }} />
                    </FormField>
                    <FormField label="Total">
                      <Input type="number" value={(it as any).totalPrice} disabled />
                    </FormField>
                  </div>
                ))}
                <Button variant="outline" onClick={()=>{
                  const copy:any = { ...editing }; copy.items = [...(copy.items||[]), { drugId: '', drugName: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]; setEditing(copy);
                }} className="w-full">Add Item</Button>
              </div>

              <div className="text-right text-sm">
                <div>Total: <span className="font-semibold">EBR {((editing.items||[]).reduce((s:any,i:any)=>s+Number(i.totalPrice||0),0)).toFixed(2)}</span></div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={()=>setEditing(null)}>Cancel</Button>
                <Button onClick={async ()=>{
                  try {
                    const payload = { patientName: editing.patientName, paymentMethod: editing.paymentMethod, items: (editing.items||[]).map((i:any)=>({ drugId: i.drugId, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })) };
                    const res = await fetch(`/api/sales/${editing._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                    const j = await res.json();
                    if (!res.ok) throw new Error(j.error || 'Failed to update sale');
                    toastManager.success('Sale updated');
                    setEditing(null);
                    const [sr, dr] = await Promise.all([fetch('/api/sales'), fetch('/api/drugs')]);
                    const sj = await sr.json().catch(()=>({}));
                    const dj = await dr.json().catch(()=>({}));
                    if (sr.ok && sj.success) setSales(sj.data || []);
                    if (dr.ok && dj.success) setDrugs(dj.data || []);
                  } catch (err:any) {
                    toastManager.error(err?.message || 'Failed to update sale');
                  }
                }} className="bg-[#1447E6] text-white">Save Changes</Button>
              </div>
            </div>
          )}
        </Modal>

      </div>
    </DashboardLayout>
  );
}


