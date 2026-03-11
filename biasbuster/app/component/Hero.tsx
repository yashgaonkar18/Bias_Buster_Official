import { Button } from "@/components/ui/button";
import { Ripple } from "@/components/ui/ripple"
import { ArrowRight, Terminal, ChevronRight, Cpu, Shield, Zap, Database, ShieldQuestionMark } from "lucide-react";

export function Hero() {
    return (
        <section className="relative min-h-screen pt-32 pb-20 overflow-hidden flex flex-col justify-center items-center">
            <Ripple />

            <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] md:w-[1000px] md:h-[1000px] -z-10 opacity-20 pointer-events-none">
                <div className="absolute inset-0 border border-foreground/30 rounded-full"></div>
                <div className="absolute inset-0 border border-foreground/30 rounded-full scale-x-[0.5]"></div>
                <div className="absolute inset-0 border border-foreground/30 rounded-full scale-x-[0.25]"></div>
                <div className="absolute inset-0 border border-foreground/20 rounded-full rotate-45"></div>
                <div className="absolute inset-0 border border-foreground/20 rounded-full -rotate-45"></div>

                <div className="absolute top-1/2 left-0 w-full h-px bg-foreground/30"></div>
                <div className="absolute top-[25%] left-[6.7%] w-[86.6%] h-px bg-foreground/30"></div>
                <div className="absolute top-[75%] left-[6.7%] w-[86.6%] h-px bg-foreground/30"></div>
            </div>

            <div className="absolute top-[20%] left-[15%] hidden lg:flex items-center justify-center size-12 bg-white rounded-lg shadow-sm border border-border animate-bounce duration-[3000ms]">
                <Cpu className="size-6 text-foreground " />
            </div>
            <div className="absolute bottom-[50%] right-[70%] hidden lg:flex items-center justify-center size-12 bg-white rounded-lg shadow-sm border border-border animate-bounce duration-[4000ms]">
                <Shield className="size-6 text-foreground" />
            </div>


            <div className="absolute top-[30%] right-[20%] hidden lg:flex items-center justify-center size-12 bg-white rounded-lg shadow-sm border border-border animate-bounce duration-[5000ms]">
                <Database className="size-6 text-foreground" />
            </div>


            <div className="container mx-auto px-4 flex flex-col items-center text-center z-10">

                <div className="mb-8 inline-flex items-center gap-2 bg-[#FDE6D8] border border-[#FBCFA8] px-4 py-1.5 rounded-sm">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8A4A1C]">
                        News
                    </span>
                    <span className="text-[10px] font-mono font-medium uppercase tracking-wide text-[#5C3213]">
                        BiasBuster 2.0: Now with Multimodal Scanning
                    </span>
                    <ChevronRight className="size-3 text-[#5C3213]" />
                </div>

                <h1 className="max-w-4xl text-[64px] md:text-8xl font-anton  uppercase leading-[0.9] tracking-tighter text-foreground  mb-6">
                    High-Performance <br />
                    Fairness For <br />
                    <span className="relative inline-block">
                        AI Models
                    </span>
                </h1>

                <p className="max-w-2xl text-lg md:text-xl text-muted-foreground mb-10 font-medium leading-relaxed">
                    Deploy intensive bias detection across text, image, and video models in minutes.
                    Scale in 50+ regions with enterprise-grade compliance.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-6 mb-20">
                    <Button size="lg" className="h-12 px-8 bg-foreground text-background hover:bg-foreground/90 rounded-md font-mono text-xs font-bold uppercase tracking-widest shadow-xl">
                        <ChevronRight className="size-3 mr-2" />
                        Get Started
                    </Button>

                    <a href="#" className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest hover:opacity-70 transition-opacity">
                        <ChevronRight className="size-3" />
                        Talk to an Expert
                        <span className="ml-1">◄</span>
                    </a>
                </div>

                <div className="w-full h-[70vh] max-w-5xl mx-auto p-3 
    rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.08)] border-2  overflow-hidden">

                    <div className="w-full h-full rounded-xl overflow-hidden relative">
                        <div className="absolute inset-0 z-10 pointer-events-none " />

                        <video
                            src=""
                            autoPlay
                            loop
                            playsInline
                            className="w-full h-full object-cover rounded-xl"
                        />
                    </div>
                </div>


            </div>
        </section>
    );
}
