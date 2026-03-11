import { Building2, Globe2, Hexagon, Layers, Zap } from "lucide-react";

export function TrustedBy() {
  const logos = [
    { name: "TechCorp", color: "text-blue-500", icon: Building2 },
    { name: "GlobalMedia", color: "text-indigo-500", icon: Globe2 },
    { name: "InnovatePlus", color: "text-purple-500", icon: Zap },
    { name: "FutureSystems", color: "text-teal-500", icon: Hexagon },
    { name: "DataFlow", color: "text-cyan-500", icon: Layers },
  ];

  return (
    <section className="py-12 border-y border-border/50 bg-secondary/30">
      <div className="container mx-auto px-4">
        <p className="text-center text-sm font-medium text-muted-foreground mb-8 uppercase tracking-widest">
          Trusted by industry leaders committed to fairness
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
          {logos.map((logo) => (
            <div key={logo.name} className="flex items-center gap-2 group cursor-default">
              <div className={`p-1.5 rounded-full bg-current ${logo.color} bg-opacity-10 group-hover:bg-opacity-20 transition-all`}>
                <logo.icon className={`size-5 ${logo.color}`} />
              </div>
              <span className="font-display font-bold text-xl text-foreground/80 group-hover:text-foreground transition-colors">
                {logo.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
