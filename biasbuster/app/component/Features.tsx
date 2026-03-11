import { Zap, RefreshCw, Globe, Layers, ArrowUpRight } from "lucide-react";

export function Features() {
  return (
    <section className="py-24 bg-background border-t border-border">
      <div className="container mx-auto px-4">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-5xl md:text-6xl font-anton uppercase leading-[0.9] mb-6">
            Next-Generation <br /> Fairness Infrastructure
          </h2>
          <p className="text-lg text-muted-foreground font-medium">
            No manual reviews, rigid rules, or compliance bottlenecks.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border border-b border-border lg:border-b-0">
          
          {/* Feature 1: Extreme Performance */}
          <div className="group relative p-6 lg:p-8 flex flex-col h-full hover:bg-secondary/30 transition-colors">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-foreground text-background px-3 py-1 rounded-sm">
                <Zap className="size-3 text-[#00FF94]" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Real-Time Speed</span>
              </div>
            </div>

            {/* Graphic Area - Speedometer/Performance */}
            <div className="h-48 mb-8 relative flex items-center justify-center">
              <div className="relative w-full max-w-[200px] aspect-[2/1] overflow-hidden">
                 {/* Gauge Arc */}
                 <div className="absolute inset-0 rounded-t-full border-[16px] border-border border-b-0"></div>
                 <div className="absolute inset-0 rounded-t-full border-[16px] border-[#00FF94] border-b-0 [clip-path:polygon(0_100%,100%_100%,100%_0,50%_50%)] origin-bottom rotate-[-45deg]"></div>
                 
                 {/* Needle */}
                 <div className="absolute bottom-0 left-1/2 w-1 h-full bg-foreground origin-bottom rotate-[45deg] transition-transform duration-1000 group-hover:rotate-[60deg]"></div>
                 
                 {/* Stats Floating */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-4 text-center bg-background/90 backdrop-blur px-3 py-1 shadow-sm border border-border rounded-sm">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase">Latency</div>
                    <div className="text-xl font-display">12ms</div>
                 </div>
              </div>
              {/* Background Grid */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px] -z-10"></div>
            </div>

            <div className="mt-auto">
              <h3 className="text-2xl font-display mb-3">Zero-Latency Scanning</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Process millions of tokens per second with our optimized inference engine. Compatible with Llama 3, GPT-4, and Claude pipelines.
              </p>
            </div>
          </div>

          {/* Feature 2: Auto Remediation */}
          <div className="group relative p-6 lg:p-8 flex flex-col h-full hover:bg-secondary/30 transition-colors">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-foreground text-background px-3 py-1 rounded-sm">
                <RefreshCw className="size-3 text-[#00FF94]" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Auto-Fix</span>
              </div>
            </div>

            {/* Graphic Area - Transformation */}
            <div className="h-48 mb-8 relative flex flex-col items-center justify-center gap-3">
               <div className="w-full bg-white border border-border p-2 rounded-sm shadow-sm transform -translate-x-4 group-hover:translate-x-0 transition-transform duration-500">
                 <div className="h-1.5 w-12 bg-red-200 rounded-full mb-1.5"></div>
                 <div className="h-1.5 w-24 bg-secondary rounded-full"></div>
               </div>
               <div className="text-[#00FF94]">
                 <ArrowUpRight className="size-5" />
               </div>
               <div className="w-full bg-white border border-[#00FF94] p-2 rounded-sm shadow-sm transform translate-x-4 group-hover:translate-x-0 transition-transform duration-500">
                 <div className="h-1.5 w-16 bg-green-200 rounded-full mb-1.5"></div>
                 <div className="h-1.5 w-20 bg-secondary rounded-full"></div>
               </div>
               
               {/* Toggle Switch Graphic */}
               <div className="absolute bottom-4 right-4">
                 <div className="w-8 h-4 bg-[#00FF94] rounded-full relative">
                   <div className="absolute right-0.5 top-0.5 size-3 bg-white rounded-full shadow-sm"></div>
                 </div>
               </div>
               {/* Background Grid */}
               <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px] -z-10"></div>
            </div>

            <div className="mt-auto">
              <h3 className="text-2xl font-display mb-3">Contextual Healing</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Automatically rewrite biased phrasing while preserving original intent. Works across 50+ languages with cultural nuance.
              </p>
            </div>
          </div>

          {/* Feature 3: Global */}
          <div className="group relative p-6 lg:p-8 flex flex-col h-full hover:bg-secondary/30 transition-colors">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-foreground text-background px-3 py-1 rounded-sm">
                <Globe className="size-3 text-[#00FF94]" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Global Scale</span>
              </div>
            </div>

            {/* Graphic Area - Map */}
            <div className="h-48 mb-8 relative flex items-center justify-center">
               {/* Abstract Map Dots */}
               <div className="relative w-full h-full opacity-50">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:10px_10px]"></div>
                 
                 {/* Active Locations */}
                 <div className="absolute top-[30%] left-[20%] flex items-center gap-1 group-hover:scale-110 transition-transform">
                    <div className="size-2 bg-[#00FF94] rounded-full animate-pulse"></div>
                    <div className="text-[8px] font-mono uppercase bg-white px-1 border border-border">SF</div>
                 </div>
                 <div className="absolute top-[40%] right-[30%] flex items-center gap-1 group-hover:scale-110 transition-transform delay-100">
                    <div className="size-2 bg-[#00FF94] rounded-full animate-pulse"></div>
                    <div className="text-[8px] font-mono uppercase bg-white px-1 border border-border">LON</div>
                 </div>
                 <div className="absolute bottom-[30%] right-[20%] flex items-center gap-1 group-hover:scale-110 transition-transform delay-200">
                    <div className="size-2 bg-[#00FF94] rounded-full animate-pulse"></div>
                    <div className="text-[8px] font-mono uppercase bg-white px-1 border border-border">SIN</div>
                 </div>
               </div>
               
               {/* Code snippet overlay */}
               <div className="absolute bottom-2 left-2 right-2 bg-white border border-border p-2 rounded-sm shadow-sm font-mono text-[8px] text-muted-foreground leading-tight opacity-80">
                 $ biasbuster deploy --region global
               </div>
            </div>

            <div className="mt-auto">
              <h3 className="text-2xl font-display mb-3">GDPR Compliant</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Data never leaves your region. Enterprise-grade PII redaction and sovereignty controls built-in by default.
              </p>
            </div>
          </div>

          {/* Feature 4: Any Stack */}
          <div className="group relative p-6 lg:p-8 flex flex-col h-full hover:bg-secondary/30 transition-colors">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-foreground text-background px-3 py-1 rounded-sm">
                <Layers className="size-3 text-[#00FF94]" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Any Modality</span>
              </div>
            </div>

            {/* Graphic Area - Icons Grid */}
            <div className="h-48 mb-8 relative flex items-center justify-center">
               <div className="grid grid-cols-2 gap-4 w-32">
                  <div className="aspect-square bg-white border border-border rounded-sm flex items-center justify-center hover:border-[#00FF94] transition-colors">
                    <span className="font-mono text-xs font-bold">TXT</span>
                  </div>
                  <div className="aspect-square bg-white border border-border rounded-sm flex items-center justify-center hover:border-[#00FF94] transition-colors">
                    <span className="font-mono text-xs font-bold">IMG</span>
                  </div>
                  <div className="aspect-square bg-white border border-border rounded-sm flex items-center justify-center hover:border-[#00FF94] transition-colors">
                    <span className="font-mono text-xs font-bold">VID</span>
                  </div>
                  <div className="aspect-square bg-white border border-border rounded-sm flex items-center justify-center hover:border-[#00FF94] transition-colors">
                    <span className="font-mono text-xs font-bold">AUD</span>
                  </div>
               </div>
               
               {/* Crosshair */}
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                 <div className="w-full h-px bg-foreground"></div>
                 <div className="h-full w-px bg-foreground absolute"></div>
               </div>
            </div>

            <div className="mt-auto">
              <h3 className="text-2xl font-display mb-3">Multi-Modal Native</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                One API for everything. Detect bias in generated images, transcribe audio for sentiment, and analyze text streams.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
