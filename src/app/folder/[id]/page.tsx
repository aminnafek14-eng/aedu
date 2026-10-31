// Halaman folder lama tidak lagi digunakan — semua aktiviti dipaparkan di halaman utama.
import { redirect } from 'next/navigation'

export default function FolderPage() {
  redirect('/')
}
