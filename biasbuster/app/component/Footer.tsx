import { Brain, ChevronRight, Twitter, Instagram, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#00FF94] text-black pt-20 pb-8 font-mono uppercase tracking-wide">
      <div className="container mx-auto px-6">

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">

          {/* Brand Column */}
          <div className="md:col-span-4 space-y-8">
            <div className="flex items-center gap-2">
              <Brain className="size-6 stroke-[2.5]" />
              <span className="font-display text-xl tracking-wider">BiasBuster</span>
            </div>

            <p className="text-xs font-bold leading-relaxed max-w-xs">
              BiasBuster is a developer-friendly serverless platform to deploy apps globally. No-ops, servers, or infrastructure management.
            </p>

            <div className="inline-flex items-center gap-2 text-xs font-bold">
              <ChevronRight className="size-3" />
              All Systems Operational
              <span className="ml-1">◄</span>
            </div>
          </div>

          {/* Links Columns */}
          <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8">

            {/* Product */}
            <div className="space-y-6">
              <h4 className="bg-black text-[#00FF94] inline-block px-2 py-1 text-xs font-bold mb-2">Product</h4>
              <ul className="space-y-4 text-xs font-bold">
                <li><a href="#" className="hover:underline decoration-2 underline-offset-4">Overview</a></li>
                <li><a href="#" className="hover:underline decoration-2 underline-offset-4">Pricing</a></li>
                <li><a href="#" className="hover:underline decoration-2 underline-offset-4">Changelog</a></li>
                <li><a href="#" className="hover:underline decoration-2 underline-offset-4">Public Roadmap</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div className="space-y-6">
              <h4 className="bg-black text-[#00FF94] inline-block px-2 py-1 text-xs font-bold mb-2">Resources</h4>
              <ul className="space-y-4 text-xs font-bold">
                <li><a href="#" className="hover:underline decoration-2 underline-offset-4">Documentation</a></li>
                <li><a href="#" className="hover:underline decoration-2 underline-offset-4">Tutorials</a></li>
                <li><a href="#" className="hover:underline decoration-2 underline-offset-4">Community</a></li>
                <li><a href="#" className="hover:underline decoration-2 underline-offset-4">API</a></li>
                <li><a href="#" className="hover:underline decoration-2 underline-offset-4">Deploy</a></li>
                <li><a href="#" className="hover:underline decoration-2 underline-offset-4">Startup Program</a></li>
                <li><a href="#" className="hover:underline decoration-2 underline-offset-4">System Status</a></li>
              </ul>
            </div>

            {/* Company */}
            <div className="space-y-6">
              <h4 className="bg-black text-[#00FF94] inline-block px-2 py-1 text-xs font-bold mb-2">Company</h4>
              <ul className="space-y-4 text-xs font-bold">
                <li><a href="#" className="hover:underline decoration-2 underline-offset-4">Blog</a></li>
                <li><a href="#" className="hover:underline decoration-2 underline-offset-4">Customer Stories</a></li>
                <li><a href="#" className="hover:underline decoration-2 underline-offset-4">Partners</a></li>
                <li><a href="#" className="hover:underline decoration-2 underline-offset-4">Events</a></li>
                <li><a href="#" className="hover:underline decoration-2 underline-offset-4">Careers</a></li>
                <li><a href="#" className="hover:underline decoration-2 underline-offset-4">Company</a></li>
                <li><a href="#" className="hover:underline decoration-2 underline-offset-4">Terms of Service</a></li>
                <li><a href="#" className="hover:underline decoration-2 underline-offset-4">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="text-[25vh] mt-[-40px] font-bold font-anton tracking-wider flex items-center justify-center 
  bg-gradient-to-t from-transparent via-black to-black bg-clip-text text-transparent ">
          BiasBuster
        </div>


        {/* Badges & Bottom Bar */}
        <div className="pt-8 border-t border-black/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="text-xs font-bold">
            BiasBuster
          </div>
          <div className="space-x-8 mr-10 flex items-center">
            <a href=""><Twitter /></a>
            <a href=""><Instagram /></a>
            <a href=""><Youtube /></a>
          </div>
        </div>
      </div>


    </footer>
  );
}
