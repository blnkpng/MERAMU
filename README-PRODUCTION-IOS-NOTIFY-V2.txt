MERAMU — Production + Global iOS Notification V2

Changes:
1. Production tetap memiliki tombol Aksi: Detail, Hapus, dan Mulai F1.
2. Semua alert() pada halaman yang memuat js/app.js kini tampil sebagai popup iOS-style MERAMU.
3. Tidak perlu mengganti alert() satu per satu di seluruh JS.
4. window.nativeMeramuAlert disediakan untuk kebutuhan debug jika native alert diperlukan.
5. D1 delete success menunggu popup ditutup sebelum kembali ke Production.
6. RPC tetap delete_meramu_production_v2.

Files changed:
- js/app.js
- js/batch-delete.js

Master data dan SQL D1 tidak diubah oleh paket ini.
