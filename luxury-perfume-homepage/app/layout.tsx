import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
});

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "HuyPerfume | Nước Hoa Chính Hãng - Tuyển Chọn Tinh Tế",
  description:
    "Khám phá bộ sưu tập nước hoa cao cấp chính hãng tại HuyPerfume. Tuyển chọn kỹ lưỡng, đóng gói tinh tế, giao hàng toàn quốc.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="bg-ivory">
      <body
        className={`${cormorant.variable} ${inter.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
