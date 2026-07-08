import './globals.css';

export const metadata = {
  title: 'Pasdisaku Auto Import & Catalog Sync',
  description: 'Admin dashboard untuk import produk otomatis, sync harga/stok, dan CRM WhatsApp',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
