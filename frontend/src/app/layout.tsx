"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { InteractionProvider } from "@/contexts/InteractionContext";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <InteractionProvider>
            {children}
          </InteractionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
