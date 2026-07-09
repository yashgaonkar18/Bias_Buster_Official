'use client';
import { Navbar } from "./component/Navbar";
import { Hero } from "./component/Hero";
import { TrustedBy } from "./component/TrustedBy";
import { Features } from "./component/Features";
import { Cta } from "./component/Cta";
import { Footer } from "./component/Footer";
import Faq from "./component/Faq";
import { ProductionReady } from "./component/Production";
import { WelcomeToast } from "./component/welcome-toast";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
function HomePageContent() {
  const params = useSearchParams();

  useEffect(() => {
    const access = params.get("access_token");
    const refresh = params.get("refresh_token");

    if (access && refresh) {
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);

      window.history.replaceState({}, "", "/");
    }
  }, [params]);

  return (
    <div className="min-h-screen text-foreground bg-noise-light bg-repeat bg-[size:10px_10px]
 bg-center  w-full">
      <WelcomeToast />
      <Navbar />
      <Hero />
      <TrustedBy />
      <Features />
      <ProductionReady />
      <Cta />
      <Faq />
      <Footer />



    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-mono">
        Loading BiasBuster...
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
