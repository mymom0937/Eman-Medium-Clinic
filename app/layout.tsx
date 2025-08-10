import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { clerkConfig } from "@/lib/config/clerk";
import { ThemeProvider } from "@/context/ThemeContext";
import { AppContextProvider } from "@/context/AppContext";
import SiteShell from "@/components/layout/SiteShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eman Clinic - Digital Clinic Management System",
  description:
    "Comprehensive digital solution for managing drug inventory, patient records, sales transactions, and medical services.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider {...clerkConfig}>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider>
            <AppContextProvider>
              <SiteShell>{children}</SiteShell>
            </AppContextProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
