import type { Metadata } from "next";
import { Rajdhani } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/shared/ui/toast/ToastProvider";

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Krabets Auth",
  description: "Krabets authentication frontend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={rajdhani.variable}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
