import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Task Stack",
  description: "Visual task management with drag-and-drop reordering",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistMono.variable} antialiased`}>
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 pt-24 pb-16">
          {children}
        </main>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#0a0a1a',
              border: '1px solid rgba(0, 240, 255, 0.15)',
              color: '#e4e4e7',
              borderRadius: '12px',
            },
          }}
        />
      </body>
    </html>
  );
}
