import type { Metadata } from "next";
import { Rajdhani, Poppins } from "next/font/google";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./globals.css";
import { ToastProvider } from "@/shared/ui/toast/ToastProvider";

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Krabets",
  description: "Krabets Gaming Dashboard",
  icons: {
    icon: "/KRABETS-FAVICON.png",
    shortcut: "/KRABETS-FAVICON.png",
    apple: "/KRABETS-FAVICON.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${rajdhani.variable} ${poppins.variable}`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
