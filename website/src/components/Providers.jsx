"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import AOS from "aos";
import "aos/dist/aos.css";

export default function Providers({ children }) {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      easing: "ease-out-cubic",
    });
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}
