import { ChevronRight, Terminal, Activity, Server, Network, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProductionReady() {
  return (
    <section className="py-24 bg-[#F5F5F5] border-t border-border relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px]"></div>

      <div className="container mx-auto px-4 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <h2 className="text-5xl md:text-7xl font-anton uppercase leading-[0.9] mb-6 tracking-tight">
            Everything you need <br /> for production
          </h2>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(300px,auto)]">
          
          {/* Card 1: Hardware - Spans 1 col */}
          <div className="group bg-white rounded-2xl p-8 shadow-sm border border-border/50 flex flex-col hover:shadow-md transition-all duration-300">
            <div className="h-40 mb-6 flex items-center justify-center gap-4">
               <div className="size-16 bg-zinc-900 rounded-lg flex items-center justify-center shadow-lg transform -rotate-6 group-hover:rotate-0 transition-transform duration-500">
                 <Zap className="size-8 text-[#00FF94]" />
               </div>
               <div className="size-16 bg-zinc-100 border border-border rounded-lg flex items-center justify-center shadow-sm transform rotate-6 group-hover:rotate-0 transition-transform duration-500">
                 <Server className="size-8 text-zinc-800" />
               </div>
            </div>
            <h3 className="text-2xl font-display mb-3">Optimized Compute</h3>
            <p className="text-sm font-jetbrains text-muted-foreground leading-relaxed mb-6">
              Access a wide range of optimized hardware for bias detection workloads. CPU, GPU, and TPU support out of the box.
            </p>
            <div className="mt-auto">
              <a href="#" className="flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-widest hover:opacity-70 transition-opacity">
                <ChevronRight className="size-3" />
                Deploy Now
              </a>
            </div>
          </div>

          {/* Card 2: API Endpoint - Spans 1 col */}
          <div className="group bg-white rounded-2xl p-8 shadow-sm border border-border/50 flex flex-col hover:shadow-md transition-all duration-300">
            <div className="h-40 mb-6 relative overflow-hidden rounded-lg bg-[#0A0A0A] border border-border shadow-inner">
               <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/10 bg-white/5">
                 <div className="size-2 rounded-full bg-red-500"></div>
                 <div className="size-2 rounded-full bg-yellow-500"></div>
                 <div className="size-2 rounded-full bg-green-500"></div>
               </div>
               <div className="p-4 font-mono text-[10px] text-green-400">
                 <p className="mb-2 text-white/50"># POST /api/v1/analyze</p>
                 <p className="typing-effect">
                   curl -X POST https://api.biasbuster.ai <br/>
                   -H &quot;Authorization: Bearer key&quot;
                 </p>
               </div>
            </div>
            <h3 className="text-2xl font-display mb-3">Instant API Endpoint</h3>
            <p className="text-sm font-jetbrains text-muted-foreground leading-relaxed mb-6">
              Just hit deploy to provision an API endpoint ready to handle requests in seconds. No config files needed.
            </p>
            <div className="mt-auto">
              <a href="#" className="flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-widest hover:opacity-70 transition-opacity">
                <ChevronRight className="size-3" />
                Get Started
              </a>
            </div>
          </div>

          {/* Card 3: Autoscaling - Spans 1 col */}
          <div className="group bg-white rounded-2xl p-8 shadow-sm border border-border/50 flex flex-col hover:shadow-md transition-all duration-300">
            <div className="h-40 mb-6 flex items-end justify-center pb-4 gap-1 relative">
               {/* Graph Bars */}
               <div className="w-4 bg-zinc-100 h-[30%] rounded-t-sm group-hover:h-[40%] transition-all duration-500 delay-75"></div>
               <div className="w-4 bg-zinc-100 h-[50%] rounded-t-sm group-hover:h-[60%] transition-all duration-500 delay-100"></div>
               <div className="w-4 bg-[#00FF94] h-[80%] rounded-t-sm shadow-[0_0_10px_rgba(0,255,148,0.4)] group-hover:h-[90%] transition-all duration-500"></div>
               <div className="w-4 bg-zinc-100 h-[60%] rounded-t-sm group-hover:h-[70%] transition-all duration-500 delay-150"></div>
               <div className="w-4 bg-zinc-100 h-[40%] rounded-t-sm group-hover:h-[50%] transition-all duration-500 delay-200"></div>
               
               {/* Label */}
               <div className="absolute top-4 right-4 bg-zinc-100 px-2 py-1 rounded text-[10px] font-mono font-bold text-zinc-600">
                 +105% Load
               </div>
            </div>
            <h3 className="text-2xl font-display mb-3">Smart Autoscaling</h3>
            <p className="text-sm font-jetbrains text-muted-foreground leading-relaxed mb-6">
              Scale down to zero when idle. Scale up to thousands of instances during peak traffic without cold starts.
            </p>
            <div className="mt-auto">
              <a href="#" className="flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-widest hover:opacity-70 transition-opacity">
                <ChevronRight className="size-3" />
                Learn More
              </a>
            </div>
          </div>

          {/* Card 4: Zero Downtime - Spans 1.5 cols (MD) -> Actually let's make it span 2 cols */}
          <div className="group md:col-span-2 bg-white rounded-2xl p-8 shadow-sm border border-border/50 flex flex-col md:flex-row gap-8 hover:shadow-md transition-all duration-300 overflow-hidden">
             <div className="flex-1 order-2 md:order-1">
                <h3 className="text-2xl font-display mb-3">Zero-Downtime Deployments</h3>
                <p className="text-sm font-jetbrains text-muted-foreground leading-relaxed mb-6 max-w-md">
                  Enjoy built-in continuous deployment with automatic health checks to prevent bad deployment and ensure you&apos;re always up and running.
                </p>
                <div className="mt-auto">
                  <a href="#" className="flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-widest hover:opacity-70 transition-opacity">
                    <ChevronRight className="size-3" />
                    View Docs
                  </a>
                </div>
             </div>
             
             {/* Visual: Deployment Pipeline */}
             <div className="flex-1 h-40 md:h-auto bg-zinc-50 rounded-xl border border-border p-4 relative order-1 md:order-2 font-mono text-[10px] flex flex-col gap-2 overflow-hidden">
                <div className="flex items-center gap-2 p-2 bg-white rounded border border-border shadow-sm transform translate-x-0 transition-transform group-hover:translate-x-2">
                   <div className="size-2 rounded-full bg-green-500 animate-pulse"></div>
                   <span className="font-bold">production-v2.4.1</span>
                   <span className="ml-auto text-muted-foreground">Just now</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-white/50 rounded border border-border/50 opacity-60 transform translate-x-0 transition-transform group-hover:translate-x-2 delay-75">
                   <div className="size-2 rounded-full bg-zinc-400"></div>
                   <span>production-v2.4.0</span>
                   <span className="ml-auto text-muted-foreground">2h ago</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-white/50 rounded border border-border/50 opacity-40 transform translate-x-0 transition-transform group-hover:translate-x-2 delay-100">
                   <div className="size-2 rounded-full bg-zinc-400"></div>
                   <span>production-v2.3.9</span>
                   <span className="ml-auto text-muted-foreground">1d ago</span>
                </div>
                
                {/* Connecting Line */}
                <div className="absolute left-6 top-8 bottom-8 w-px bg-border -z-10"></div>
             </div>
          </div>

          {/* Card 5: Native Protocol Support - Spans 1 col */}
          <div className="group bg-white rounded-2xl p-8 shadow-sm border border-border/50 flex flex-col hover:shadow-md transition-all duration-300">
            <div className="h-40 mb-6 flex items-center justify-center relative">
               {/* Concentric Circles */}
               <div className="absolute size-32 rounded-full border border-dashed border-zinc-200 animate-spin-slow"></div>
               <div className="absolute size-20 rounded-full border border-zinc-300"></div>
               <div className="absolute size-12 rounded-full bg-zinc-900 flex items-center justify-center z-10 shadow-lg">
                  <Network className="size-6 text-white" />
               </div>
               
               {/* Floating Labels */}
               <div className="absolute top-2 right-2 bg-[#E5E5E5] px-2 py-0.5 rounded text-[8px] font-mono font-bold">gRPC</div>
               <div className="absolute bottom-4 left-2 bg-[#E5E5E5] px-2 py-0.5 rounded text-[8px] font-mono font-bold">HTTP/2</div>
               <div className="absolute top-8 left-0 bg-[#E5E5E5] px-2 py-0.5 rounded text-[8px] font-mono font-bold">WS</div>
            </div>
            <h3 className="text-2xl font-display mb-3">Native Protocol Support</h3>
            <p className="text-sm font-jetbrains text-muted-foreground leading-relaxed mb-6">
              Stream large or partial responses to end-users via HTTP/2, WebSocket, and gRPC.
            </p>
            <div className="mt-auto">
              <a href="#" className="flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-widest hover:opacity-70 transition-opacity">
                <ChevronRight className="size-3" />
                Learn More
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
