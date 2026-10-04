MERAMU D1 — Hapus Produksi dari Production

Perubahan:
- Kolom Aksi di production.html sekarang memiliki tombol Hapus.
- Tombol membuka modal D1 yang sama dengan Batch Detail.
- Modal menggunakan batch yang dipilih langsung dari tabel Production.
- Tidak perlu masuk ke Batch Detail terlebih dahulu.
- batch-delete.js tetap memakai RPC delete_meramu_production_v2.
- Batch Detail tetap kompatibel: tombol lama tetap bekerja dari URL batch-detail.html?id=...
- Master Product, Recipe, Recipe Version, Ingredient, Unit, dan master data tidak dihapus.

File utama:
- pages/production.html
- js/production.js
- js/batch-delete.js
- css/production.css
