import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export function Cta() {
  return (
    <section className="py-32 bg-noise-dark bg-repeat relative overflow-hidden flex items-center justify-center">
      
      {/* Background Wireframe Sphere (Dark Mode Version) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] -z-10 opacity-10 pointer-events-none">
         {/* Horizontal Lines */}
         <div className="absolute top-0 left-0 w-full h-px bg-white/20"></div>
         <div className="absolute top-1/4 left-[5%] w-[90%] h-px bg-white/20 rounded-[100%]"></div>
         <div className="absolute top-1/2 left-0 w-full h-px bg-white/20"></div>
         <div className="absolute top-3/4 left-[5%] w-[90%] h-px bg-white/20 rounded-[100%]"></div>
         <div className="absolute bottom-0 left-0 w-full h-px bg-white/20"></div>
         
         {/* Vertical Lines */}
         <div className="absolute top-0 left-1/2 h-full w-px bg-white/20"></div>
         <div className="absolute top-0 left-1/4 h-full w-px bg-white/20 rounded-[100%]"></div>
         <div className="absolute top-0 right-1/4 h-full w-px bg-white/20 rounded-[100%]"></div>
      </div>

      <div className="container mx-auto px-4 text-center z-10">
        <h2 className="text-5xl md:text-7xl font-anton uppercase leading-[1] mb-10 tracking-tight text-white">
          Deploy AI/ML Models to <br />
          Production in Minutes
        </h2>
        
        <div className="flex flex-col items-center gap-6">
          <Button 
            size="lg" 
            variant="outline" 
            className="h-14 px-8 border border-[#00FF94] text-[#00FF94] hover:bg-[#00FF94] hover:text-black bg-transparent rounded-sm font-mono text-xs font-bold uppercase tracking-widest transition-all"
          >
            <ChevronRight className="size-3 mr-2" />
            Get Started
          </Button>
          
          <a href="#" className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors">
             <ChevronRight className="size-3" />
             Talk to an Expert
             <span className="ml-1">◄</span>
          </a>
        </div>
      </div>
    </section>
  );
}
