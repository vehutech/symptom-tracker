import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "FUL Health Services — Hospital Management System",
    template: "%s · FUL Health Services",
  },
  description:
    "Federal University Lokoja University Health Services: appointments, patient records and the Patient Health & Symptom Tracker.",
  icons: { icon: "/ful-logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} antialiased`}>{children}</body>
    </html>
  );
}
