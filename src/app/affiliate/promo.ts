// Templat mesej promosi — dikongsi oleh halaman panduan & dashboard
export const PROMO_TEMPLATES: { title: string; body: (link: string) => string }[] = [
  {
    title: 'WhatsApp — ibu bapa',
    body: (link) =>
`Assalamualaikum ibu bapa 👋

Anak suka main game? Cuba AEdu — portal pembelajaran gamifikasi untuk murid sekolah rendah. Kuiz, permainan Matematik, Sains dan Bahasa dalam satu tempat.

✅ Daftar percuma
💎 Premium buka semua aktiviti

Daftar di sini: ${link}`,
  },
  {
    title: 'Kumpulan kelas / guru',
    body: (link) =>
`Cikgu dan ibu bapa, saya kongsikan AEdu — koleksi aktiviti pembelajaran interaktif ikut Tahun 1 hingga 6. Sesuai untuk ulang kaji di rumah.

Pautan pendaftaran: ${link}`,
  },
  {
    title: 'Hantaran ringkas media sosial',
    body: (link) =>
`Belajar sambil bermain 🎮📚 AEdu — aktiviti gamifikasi untuk murid sekolah rendah. Daftar percuma: ${link}`,
  },
]
