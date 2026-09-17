# Perbaikan PDF agar mengikuti template Word

## Tujuan
PDF unduhan admin akan menampilkan formulir sedekat mungkin dengan dokumen Word resmi, termasuk ukuran halaman, tabel, garis, logo, posisi teks, dan tanda tangan.

## Perubahan
- Ganti pembentukan ulang PDF berbasis daftar teks/tabel dengan rendering visual langsung dari DOCX yang sudah terisi.
- Render setiap halaman Word pada wadah tersembunyi, lalu cetak halaman tersebut ke PDF A4 satu per satu.
- Pertahankan ekspor Word yang sudah ada dan jangan mengubah data kandidat atau formulir.
- Tambahkan penanganan halaman, gambar, dan font agar hasil tidak terpotong atau bertumpuk.

## Verifikasi
- Unduh Word dan PDF dari kandidat uji yang berisi tabel serta tanda tangan.
- Bandingkan urutan halaman, tabel, logo, teks, dan tanda tangan.
- Pastikan unduhan dari Bank Data HC tetap berjalan tanpa error.

## Catatan teknis
Gunakan renderer DOCX di browser dan tangkapan halaman beresolusi tinggi untuk PDF. Pendekatan lama yang membaca DOCX menjadi blok sederhana akan dihentikan khusus untuk PDF karena menghilangkan lebar kolom, gabungan sel, tinggi baris, border, gambar, dan pemisah halaman Word.
