import { Inter } from 'next/font/google';
import './globals.css';
import 'react-pdf/dist/cjs/Page/AnnotationLayer.css';
import 'react-pdf/dist/cjs/Page/TextLayer.css';

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'PDF OCR Search',
  description: 'Upload PDFs and search through them with OCR capabilities',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
