import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const poppins = Poppins({
  weight: ["300", "600"],
  variable: "--font-poppins",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Recipe Finder",
  description: "Find your favorite recipes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased`}>
      <body
        className={`min-h-full flex flex-col dark font-semibold ${poppins.className}`}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}
