import { Zap, RefreshCw, Globe, Layers, Check, AlertTriangle } from "lucide-react";

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
            Detect bias, apply intelligent mitigation, and generate explainable fairness reports—all from a single platform.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border border-b border-border lg:border-b-0">

          {/* Feature 1: Automated Bias Detection */}
          <div className="group relative p-6 lg:p-8 flex flex-col h-full hover:bg-secondary/30 transition-colors">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-foreground text-background px-3 py-1 rounded-sm">
                <Zap className="size-3 text-[#00FF94]" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Bias Detection</span>
              </div>
            </div>

            {/* Graphic Area - Bar Comparison */}
            {/* Graphic Area - Bar Comparison */}
            <div className="h-48 mb-8 relative flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">

                {/* Parity Gap Badge - now part of the centered flow, not floating */}
                <div className="text-center bg-background/90 backdrop-blur px-3 py-1 shadow-sm border border-border rounded-sm">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase">Parity Gap</div>
                  <div className="text-lg font-display text-[#00FF94]">2%</div>
                </div>

                {/* Bars */}
                <div className="flex items-end justify-center gap-6">
                  {/* Group A Bar */}
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground">A</span>
                    <div className="w-10 bg-border rounded-t-sm relative overflow-hidden h-20 flex items-end">
                      <div className="w-full bg-[#00FF94] transition-all duration-1000 group-hover:h-[82%] h-[80%]"></div>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">80%</span>
                  </div>

                  {/* Group B Bar */}
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground">B</span>
                    <div className="w-10 bg-border rounded-t-sm relative overflow-hidden h-20 flex items-end">
                      <div className="w-full bg-[#00FF94] transition-all duration-1000 group-hover:h-[80%] h-[78%]"></div>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">78%</span>
                  </div>
                </div>
              </div>

              {/* Background Grid */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px] -z-10"></div>
            </div>

            <div className="mt-auto mb-[-20px]">
              <h3 className="text-2xl font-display mb-3">Automated Bias Detection</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Identify hidden bias in machine learning models using industry-standard fairness metrics such as Demographic Parity, Equal Opportunity, and Disparate Impact.
              </p>
            </div>
          </div>

          {/* Feature 2: Intelligent Bias Mitigation */}
          <div className="group relative p-6 lg:p-8 flex flex-col h-full hover:bg-secondary/30 transition-colors">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-foreground text-background px-3 py-1 rounded-sm">
                <RefreshCw className="size-3 text-[#00FF94]" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Mitigation</span>
              </div>
            </div>

            {/* Graphic Area - Detection Scan */}
            <div className="h-48 mb-8 relative flex items-center justify-center">
              <div className="w-full flex flex-col gap-2">

                {/* Data Row 1 - Clean */}
                <div className="w-full bg-white border border-border p-2 rounded-sm shadow-sm flex items-center justify-between">
                  <div className="flex flex-col gap-1.5">
                    <div className="h-1.5 w-16 bg-secondary rounded-full"></div>
                    <div className="h-1.5 w-10 bg-secondary rounded-full"></div>
                  </div>
                  <Check className="size-3.5 text-muted-foreground" />
                </div>

                {/* Data Row 2 - Flagged */}
                <div className="w-full bg-white border border-red-400 p-2 rounded-sm shadow-sm flex items-center justify-between relative transform group-hover:-translate-x-1 transition-transform duration-500">
                  <div className="flex flex-col gap-1.5">
                    <div className="h-1.5 w-20 bg-red-200 rounded-full"></div>
                    <div className="h-1.5 w-12 bg-red-200 rounded-full"></div>
                  </div>
                  <AlertTriangle className="size-3.5 text-red-500" />

                  {/* Scan line sweeping across */}
                  <div className="absolute inset-y-0 left-0 w-0.5 bg-[#00FF94] opacity-0 group-hover:opacity-100 group-hover:left-full transition-all duration-1000"></div>
                </div>

                {/* Data Row 3 - Clean */}
                <div className="w-full bg-white border border-border p-2 rounded-sm shadow-sm flex items-center justify-between">
                  <div className="flex flex-col gap-1.5">
                    <div className="h-1.5 w-14 bg-secondary rounded-full"></div>
                    <div className="h-1.5 w-24 bg-secondary rounded-full"></div>
                  </div>
                  <Check className="size-3.5 text-muted-foreground" />
                </div>
              </div>

              {/* Detected Count Badge */}
              <div className="absolute bottom-4 right-4 bg-foreground text-background px-2 py-1 rounded-sm flex items-center gap-1">
                <AlertTriangle className="size-3 text-red-400" />
                <span className="text-[10px] font-mono font-bold">1 FLAGGED</span>
              </div>

              {/* Background Grid */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px] -z-10"></div>
            </div>
            <div className="mt-auto">
              <h3 className="text-2xl font-display mb-3">Intelligent Bias Mitigation</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Automatically reduce unfair predictions with SMOTE, Reweighting, and Threshold Optimization while maintaining model performance.
              </p>
            </div>
          </div>

          {/* Feature 3: Explainable Fairness */}
          <div className="group relative p-6 lg:p-8 flex flex-col h-full hover:bg-secondary/30 transition-colors">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-foreground text-background px-3 py-1 rounded-sm">
                <Globe className="size-3 text-[#00FF94]" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Explainability</span>
              </div>
            </div>

            {/* Graphic Area - Map */}
            <div className="h-48 mb-8 relative flex items-center justify-center">
              <div className="relative w-full h-full opacity-50">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:10px_10px]"></div>

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
                $ biasbuster analyze --fairness
              </div>
            </div>

            <div className="mt-auto">
              <h3 className="text-2xl font-display mb-3">Explainable Fairness</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Visualize fairness metrics, compare model performance before and after mitigation, and generate transparent AI audit reports.
              </p>
            </div>
          </div>

          {/* Feature 4: Multimodal AI */}
          <div className="group relative p-6 lg:p-8 flex flex-col h-full hover:bg-secondary/30 transition-colors">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-foreground text-background px-3 py-1 rounded-sm">
                <Layers className="size-3 text-[#00FF94]" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Coming Soon</span>
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
              <h3 className="text-2xl font-display mb-3">Multimodal AI Testing</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Analyze fairness across text, images, audio, and video from a unified platform. Next-generation multimodal bias detection is coming soon.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}