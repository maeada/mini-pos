'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function HistoryPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลประวัติการขายทั้งหมดจากตาราง sales เรียงจากล่าสุดไปเก่าสุด
  const fetchSalesHistory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('sold_at', { ascending: false });

    if (error) {
      alert('เกิดข้อผิดพลาดในการโหลดประวัติการขาย: ' + error.message);
    } else {
      setSales(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSalesHistory();
  }, []);

  // คำนวณยอดขายรวมทั้งหมด (sum ของ total_price)
  const grandTotal = sales.reduce(
    (sum, item) => sum + Number(item.total_price || 0),
    0
  );

  // จัดรูปแบบวันเวลาให้อ่านง่ายในรูปแบบไทย
  const formatDateTime = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div>
      <h1>ประวัติการขาย</h1>

      {/* กล่องแสดงสรุปยอดขายรวมทั้งหมดด้านบนตาราง */}
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#f8fafc',
          borderLeft: '4px solid #2563eb',
        }}
      >
        <div>
          <div style={{ fontSize: '0.9rem', color: '#4b5563' }}>
            ยอดขายรวมทั้งหมด ({sales.length} รายการ)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#111827' }}>
            {grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
          </div>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={fetchSalesHistory}
          disabled={loading}
        >
          {loading ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล'}
        </button>
      </div>

      {/* ตารางแสดงรายการประวัติการขาย */}
      <div className="card" style={{ overflowX: 'auto' }}>
        <h2>รายการขายย้อนหลัง</h2>
        {loading ? (
          <p>กำลังโหลดข้อมูล...</p>
        ) : sales.length === 0 ? (
          <p style={{ color: '#6b7280' }}>ยังไม่มีประวัติการขาย</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>วันเวลาที่ขาย</th>
                <th>ชื่อสินค้า</th>
                <th>จำนวน</th>
                <th>ยอดรวม (บาท)</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td>{formatDateTime(sale.sold_at)}</td>
                  <td>{sale.product_name}</td>
                  <td>{sale.quantity}</td>
                  <td style={{ fontWeight: '600' }}>
                    {Number(sale.total_price).toLocaleString('th-TH', {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
