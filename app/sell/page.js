'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function SellPage() {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ดึงรายการสินค้าทั้งหมดจาก Supabase เพื่อนำมาแสดงใน Dropdown
  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      alert('เกิดข้อผิดพลาดในการโหลดรายการสินค้า: ' + error.message);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ค้นหาข้อมูลสินค้าที่ถูกเลือกอยู่จาก Dropdown
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // คำนวณยอดรวมอัตโนมัติ (ราคา x จำนวน)
  const numericQty = parseInt(quantity, 10) || 0;
  const totalPrice = selectedProduct ? Number(selectedProduct.price) * numericQty : 0;

  // จัดการเมื่อกดปุ่ม "ขาย"
  const handleSell = async (e) => {
    e.preventDefault();

    if (!selectedProduct) {
      alert('กรุณาเลือกสินค้าที่ต้องการขาย');
      return;
    }

    if (numericQty <= 0) {
      alert('กรุณากรอกจำนวนสินค้าให้มากกว่า 0');
      return;
    }

    // 1. ตรวจสอบสต็อกคงเหลือว่าเพียงพอหรือไม่
    if (numericQty > selectedProduct.stock) {
      alert(
        `สต็อกสินค้าไม่เพียงพอ (คงเหลือ ${selectedProduct.stock} ${selectedProduct.unit})`
      );
      return;
    }

    setSubmitting(true);

    // 2. บันทึกรายการขายลงตาราง sales
    const { error: saleError } = await supabase.from('sales').insert([
      {
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        quantity: numericQty,
        total_price: totalPrice,
        sold_at: new Date().toISOString(),
      },
    ]);

    if (saleError) {
      alert('บันทึกการขายไม่สำเร็จ: ' + saleError.message);
      setSubmitting(false);
      return;
    }

    // 3. อัปเดต stock ในตาราง products ให้ลดลงตามจำนวนที่ขาย
    const newStock = selectedProduct.stock - numericQty;
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', selectedProduct.id);

    if (updateError) {
      alert('บันทึกการขายแล้ว แต่ตัดสต็อกไม่สำเร็จ: ' + updateError.message);
      setSubmitting(false);
      return;
    }

    // 4. แจ้งเตือนขายสำเร็จ รีเซ็ตฟอร์ม และอัปเดตข้อมูลสินค้าล่าสุด
    alert(
      `ขายสินค้า "${selectedProduct.name}" จำนวน ${numericQty} ${selectedProduct.unit} สำเร็จ!`
    );
    setSelectedProductId('');
    setQuantity(1);
    setSubmitting(false);
    fetchProducts();
  };

  return (
    <div>
      <h1>ขายสินค้า (POS)</h1>

      <div className="card" style={{ maxWidth: '520px' }}>
        {loading ? (
          <p>กำลังโหลดรายการสินค้า...</p>
        ) : (
          <form onSubmit={handleSell} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Dropdown เลือกสินค้า */}
            <div>
              <label style={{ fontSize: '0.9rem', fontWeight: '500', display: 'block', marginBottom: '0.35rem' }}>
                เลือกสินค้า
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                required
              >
                <option value="">-- กรุณาเลือกสินค้า --</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id} disabled={product.stock <= 0}>
                    {product.name} - {Number(product.price).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท (คงเหลือ: {product.stock} {product.unit})
                  </option>
                ))}
              </select>
            </div>

            {/* ช่องกรอกจำนวนที่จะขาย */}
            <div>
              <label style={{ fontSize: '0.9rem', fontWeight: '500', display: 'block', marginBottom: '0.35rem' }}>
                จำนวนที่ขาย {selectedProduct ? `(${selectedProduct.unit})` : ''}
              </label>
              <input
                type="number"
                min="1"
                max={selectedProduct ? selectedProduct.stock : undefined}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
              {selectedProduct && (
                <small style={{ color: '#6b7280', display: 'block', marginTop: '0.25rem' }}>
                  สต็อกคงเหลือปัจจุบัน: {selectedProduct.stock} {selectedProduct.unit}
                </small>
              )}
            </div>

            {/* กล่องแสดงยอดรวมอัตโนมัติ */}
            <div
              style={{
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontWeight: '600', color: '#374151' }}>ยอดรวมสุทธิ:</span>
              <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563eb' }}>
                {totalPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
              </span>
            </div>

            {/* ปุ่มยืนยันการขาย */}
            <button
              type="submit"
              disabled={submitting || !selectedProduct}
              style={{ padding: '0.75rem', fontSize: '1rem', fontWeight: '600' }}
            >
              {submitting ? 'กำลังบันทึกการขาย...' : 'ขาย'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
