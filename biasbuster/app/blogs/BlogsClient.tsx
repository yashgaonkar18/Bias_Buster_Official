"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "../component/Navbar";
import { Footer } from "../component/Footer";
import { Button } from "@/components/ui/button";
import { BLOG_POSTS, CATEGORIES, Category } from "@/data/blogs";
import { ArrowRight, Calendar, Clock, Sparkles, Brain, Cpu, ShieldCheck, Layers, Scale, Code } from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "AI Fairness": Brain,
  "Bias Detection": ShieldCheck,
  "Engineering": Cpu,
  "Responsible AI": Scale,
  "Machine Learning": Layers,
};

export default function BlogsClient() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");

  const featuredPost = BLOG_POSTS.find((post) => post.featured) || BLOG_POSTS[0];
  const latestPosts = BLOG_POSTS.filter((post) => !post.featured);
  const filteredPosts =
    activeCategory === "All"
      ? latestPosts
      : latestPosts.filter((post) => post.category === activeCategory);

  return (
    <div className="min-h-screen text-foreground bg-noise-light bg-repeat bg-[size:10px_10px] bg-center w-full flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 container mx-auto px-4 md:px-6">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl md:text-7xl font-anton uppercase tracking-tight leading-none mb-6">
            Blogs
          </h1>
          <p className="text-base md:text-lg font-jetbrains text-muted-foreground leading-relaxed">
            Insights on AI fairness, responsible machine learning, bias detection, and building more accountable AI systems.
          </p>
        </div>

        {/* Featured Article Card */}
        {featuredPost && (
          <div className="mb-20">
            <div className="bg-white rounded-2xl border border-border/80 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 hover:shadow-md transition-all duration-300">
              {/* Featured Image Container */}
              <div className="lg:col-span-7 bg-zinc-900 relative min-h-[280px] lg:min-h-[380px] p-8 flex flex-col justify-between overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808015_1px,transparent_1px),linear-gradient(to_bottom,#80808015_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                <div className="relative z-10 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 bg-[#00FF94] text-black font-mono font-bold text-xs uppercase px-3 py-1 rounded-sm">
                    <Sparkles className="size-3.5 fill-black" />
                    Featured Article
                  </span>
                  <span className="font-mono text-xs text-zinc-400 uppercase tracking-widest">
                    {featuredPost.category}
                  </span>
                </div>

                <div className="relative z-10 my-auto py-8 flex items-center justify-center">
                  <div className="size-24 rounded-2xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center shadow-xl">
                    <Brain className="size-12 text-[#00FF94]" />
                  </div>
                </div>

                <div className="relative z-10 flex items-center gap-4 text-xs font-mono text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5" /> {featuredPost.date}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" /> {featuredPost.readingTime}
                  </span>
                </div>
              </div>

              {/* Featured Content Container */}
              <div className="lg:col-span-5 p-8 lg:p-10 flex flex-col justify-between bg-white">
                <div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8A4A1C] bg-[#FDE6D8] border border-[#FBCFA8] px-2.5 py-1 rounded-sm inline-block mb-4">
                    Research & Insights
                  </span>
                  <Link href={`/blogs/${featuredPost.slug}`}>
                    <h2 className="text-2xl lg:text-3xl font-display font-semibold tracking-tight text-foreground mb-4 leading-tight hover:text-primary transition-colors">
                      {featuredPost.title}
                    </h2>
                  </Link>
                  <p className="text-sm font-jetbrains text-muted-foreground leading-relaxed mb-6">
                    {featuredPost.excerpt}
                  </p>
                </div>

                <div>
                  <Button asChild className="bg-foreground text-background hover:bg-foreground/90 font-mono text-xs uppercase tracking-wider group">
                    <Link href={`/blogs/${featuredPost.slug}`}>
                      Read Article
                      <ArrowRight className="size-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section Header & Category Filter */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/80 pb-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-anton uppercase tracking-tight text-foreground">
              Latest Articles
            </h2>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((category) => {
              const isActive = activeCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider rounded-md transition-all duration-200 ${
                    isActive
                      ? "bg-foreground text-background shadow-xs"
                      : "bg-white/80 text-muted-foreground hover:text-foreground hover:bg-white border border-border/60"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {/* Articles Grid */}
        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filteredPosts.map((post) => {
              const IconComponent = CATEGORY_ICONS[post.category] || Code;
              return (
                <div
                  key={post.slug}
                  className="bg-white rounded-2xl border border-border/80 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all duration-300 group"
                >
                  <div className="h-48 bg-zinc-900 relative p-6 flex flex-col justify-between overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px]"></div>

                    <div className="relative z-10">
                      <span className="bg-white/10 backdrop-blur-md text-white border border-white/20 font-mono text-[10px] font-bold uppercase px-2.5 py-1 rounded-sm">
                        {post.category}
                      </span>
                    </div>

                    <div className="relative z-10 flex items-center justify-center my-auto">
                      <div className="size-14 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[#00FF94] group-hover:scale-110 transition-transform">
                        <IconComponent className="size-7" />
                      </div>
                    </div>

                    <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" /> {post.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" /> {post.readingTime}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between bg-white">
                    <div>
                      <Link href={`/blogs/${post.slug}`}>
                        <h3 className="text-xl font-display font-semibold text-foreground mb-3 leading-snug group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                      </Link>
                      <p className="text-xs font-jetbrains text-muted-foreground leading-relaxed mb-6">
                        {post.excerpt}
                      </p>
                    </div>

                    <Link
                      href={`/blogs/${post.slug}`}
                      className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-foreground hover:underline underline-offset-4"
                    >
                      Read Article
                      <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 border border-border/80 text-center">
            <p className="font-mono text-sm text-muted-foreground uppercase tracking-wide">
              No articles found for this category.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
