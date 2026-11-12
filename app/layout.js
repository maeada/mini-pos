import Link from 'next/link';
import './globals.css';

export const metadata = {
  title: 'Mini POS',
  description: 'ระบบขายของหน้าร้านขนาดเล็ก',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>
        <header className="navbar">
          <div className="nav-container">
            <Link href="/" className="brand">
              Mini POS
            </Link>
            <nav className="nav-links">
              <Link href="/">จัดการสินค้า</Link>
              <Link href="/sell">ขายสินค้า</Link>
              <Link href="/history">ประวัติการขาย</Link>
            </nav>
          </div>
        </header>
        <main className="main-container">{children}</main>
      </body>
    </html>
  );
}
