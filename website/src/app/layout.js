import "./globals.css";
import { Outfit } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import HomeSettings from "@/components/HomeSettings";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export const metadata = {
  title: {
    template: "%s | Maigation",
    default: "Maigation - Football Predictions",
  },
  description:
    "High-probability football predictions verified on SportyBet. Daily match analysis for informed betting.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={outfit.variable} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Providers>
          <Navbar />
          {children}
          <Footer />
          <HomeSettings />
        </Providers>
      </body>
    </html>
  );
}
