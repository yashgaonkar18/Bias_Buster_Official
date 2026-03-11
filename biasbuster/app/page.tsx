import { Navbar } from "./component/Navbar";
import { Hero } from "./component/Hero";
import { TrustedBy } from "./component/TrustedBy";
import { Features } from "./component/Features";
import {Cta} from "./component/Cta";
import { Footer } from "./component/Footer";
import Faq from "./component/Faq";
import { ProductionReady } from "./component/Production";
export default function HomePage() {
  return (
    <div className="min-h-screen text-foreground bg-noise-light bg-repeat bg-[size:10px_10px]
 bg-center  w-full">
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
  