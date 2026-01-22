import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shiksha - School Management System | Orchid Software",
  description: "Transform education management into digital excellence. Comprehensive cloud-based School Management System for student management, attendance, fees, exams, and WhatsApp integration. From 100 to 10,000+ students.",
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon.svg', type: 'image/svg+xml' },
    ],
  },
  openGraph: {
    title: "Shiksha - School Management System",
    description: "Streamline administrative operations, enhance communication, and improve efficiency with our comprehensive cloud-based School Management System.",
    url: "https://shiksha.orchidsw.com",
    siteName: "Shiksha ERP",
    images: [
      {
        url: "/shiksha-erp.jpg",
        width: 1200,
        height: 630,
        alt: "Shiksha ERP - School Management System",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shiksha - School Management System",
    description: "Transform Education Management Into Digital Excellence. Comprehensive cloud-based School Management System for modern schools.",
    images: ["/shiksha-erp.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
