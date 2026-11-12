'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // State สำหรับฟอร์มเพิ่มสินค้าใหม่
  const [form, setForm] = useState({
    sku: '',
    name: '',
    price: '',
    stock: '',
    unit: '',
  });

  // State สำหรับการแก้ไขสินค้าแบบ Inline ในตาราง
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    sku: '',
    name: '',
    price: '',
    stock: '',
    unit: '',
  });

  // ดึงรายการสินค้าทั้งหมดจาก Supabase
  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + error.message);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // เพิ่มสินค้าใหม่ลงตาราง products
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!form.sku || !form.name || !form.price || !form.stock || !form.unit) {
      alert('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }

    const { error } = await supabase.from('products').insert([
      {
        sku: form.sku.trim(),
        name: form.name.trim(),
        price: Number(form.price),
        stock: parseInt(form.stock, 10),
        unit: form.unit.trim(),
      },
    ]);

    if (error) {
      alert('เพิ่มสินค้าไม่สำเร็จ: ' + error.message);
    } else {
      setForm({ sku: '', name: '', price: '', stock: '', unit: '' });
      fetchProducts();
    }
  };

  // เปิดโหมดแก้ไขและนำค่าเดิมมาใส่ในช่องกรอก
  const startEdit = (product) => {
    setEditingId(product.id);
    setEditForm({
      sku: product.sku,
      name: product.name,
      price: product.price,
      stock: product.stock,
      unit: product.unit,
    });
  };

  // บันทึกการแก้ไขสินค้าลง Supabase
  const handleUpdateProduct = async (id) => {
    const { error } = await supabase
      .from('products')
      .update({
        sku: editForm.sku.trim(),
        name: editForm.name.trim(),
        price: Number(editForm.price),
        stock: parseInt(editForm.stock, 10),
        unit: editForm.unit.trim(),
      })
      .eq('id', id);

    if (error) {
      alert('แก้ไขสินค้าไม่สำเร็จ: ' + error.message);
    } else {
      setEditingId(null);
      fetchProducts();
    }
  };

  // ลบสินค้าออกจาก Supabase
  const handleDeleteProduct = async (id, name) => {
    if (!confirm(`ต้องการลบสินค้า "${name}" ใช่หรือไม่?`)) return;

    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      alert('ลบสินค้าไม่สำเร็จ: ' + error.message);
    } else {
      fetchProducts();
    }
  };

  return (
    <div>
      <h1>จัดการรายการสินค้า</h1>

      {/* ฟอร์มเพิ่มสินค้าใหม่ */}
      <div className="card">
        <h2>เพิ่มสินค้าใหม่</h2>
        <form
          onSubmit={handleAddProduct}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '0.75rem',
            alignItems: 'end',
          }}
        >
          <div>
            <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>
              รหัส SKU
            </label>
            <input
              type="text"
              placeholder="เช่น P001"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>
              ชื่อสินค้า
            </label>
            <input
              type="text"
              placeholder="เช่น น้ำดื่ม 600 มล."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>
              ราคา (บาท)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>
              คงเหลือ
            </label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>
              หน่วยนับ
            </label>
            <input
              type="text"
              placeholder="เช่น ขวด, ชิ้น"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            />
          </div>

          <button type="submit">+ เพิ่มสินค้า</button>
        </form>
      </div>

      {/* ตารางแสดงรายการสินค้า */}
      <div className="card" style={{ overflowX: 'auto' }}>
        <h2>รายการสินค้าทั้งหมด ({products.length})</h2>
        {loading ? (
          <p>กำลังโหลดข้อมูล...</p>
        ) : products.length === 0 ? (
          <p style={{ color: '#6b7280' }}>ยังไม่มีรายการสินค้า</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>ชื่อสินค้า</th>
                <th>ราคา</th>
                <th>คงเหลือ</th>
                <th>หน่วย</th>
                <th style={{ width: '160px' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const isEditing = editingId === product.id;
                return (
                  <tr key={product.id}>
                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.sku}
                          onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                        />
                      ) : (
                        product.sku
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      ) : (
                        product.name
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.price}
                          onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                        />
                      ) : (
                        Number(product.price).toLocaleString('th-TH', {
                          minimumFractionDigits: 2,
                        })
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editForm.stock}
                          onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                        />
                      ) : (
                        product.stock
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.unit}
                          onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                        />
                      ) : (
                        product.unit
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateProduct(product.id)}
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
                            >
                              บันทึก
                            </button>
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => setEditingId(null)}
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
                            >
                              ยกเลิก
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => startEdit(product)}
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
                            >
                              แก้ไข
                            </button>
                            <button
                              type="button"
                              className="btn-danger"
                              onClick={() => handleDeleteProduct(product.id, product.name)}
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
                            >
                              ลบ
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
