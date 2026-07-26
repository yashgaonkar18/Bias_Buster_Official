'use client';

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "../component/Navbar";
import { Footer } from "../component/Footer";
import { blogs, categories } from "../../data/blogs";
import { ChevronRight, Calendar, Clock } from "lucide-react";

export default function BlogsPage() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredBlogs = blogs.filter((blog) =>
    activeCategory === "All" ? true : blog.category === activeCategory
  );

  const featuredBlog = blogs.find((blog) => blog.featured);
  const remainingBlogs = filteredBlogs.filter((blog) => blog.slug !== featuredBlog?.slug);

  return (
    <div className="min-h-screen flex flex-col text-foreground bg-noise-light bg-repeat bg-[size:10px_10px] bg-center w-full">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-6 pt-32 pb-24">
        {/* Header Section */}
        <div className="max-w-3xl mb-16">
          <h1 className="font-display text-5xl md:text-7xl uppercase tracking-tighter mb-6">
            Blogs
          </h1>
          <p className="text-xl text-muted-foreground font-jetbrains max-w-2xl">
            Insights on AI fairness, responsible machine learning, bias detection, and building more accountable AI systems.
          </p>
        </div>

        {/* Categories / Filter */}
        <div className="flex flex-wrap gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 text-sm font-jetbrains uppercase tracking-wider rounded-sm transition-all border ${
                activeCategory === category
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-foreground border-border hover:bg-muted"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {filteredBlogs.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-lg">
            <h3 className="font-display text-2xl uppercase tracking-wider text-muted-foreground">
              No articles published yet.
            </h3>
          </div>
        ) : (
          <>
            {/* Featured Blog */}
            {featuredBlog && (activeCategory === "All" || activeCategory === featuredBlog.category) && (
              <div className="mb-20">
                <Link href={`/blogs/${featuredBlog.slug}`} className="group block">
                  <div className="grid md:grid-cols-2 gap-8 items-center bg-background border border-border p-6 rounded-xl hover:shadow-xl transition-all">
                    <div className="aspect-[4/3] md:aspect-auto md:h-full relative overflow-hidden rounded-lg">
                      <img
                        src={featuredBlog.coverImage}
                        alt={featuredBlog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-4 left-4 bg-foreground text-background text-xs font-jetbrains uppercase px-3 py-1 rounded-sm font-bold tracking-widest">
                        Featured
                      </div>
                    </div>
                    <div className="flex flex-col justify-center">
                      <div className="flex items-center gap-4 text-xs font-jetbrains uppercase tracking-wider text-muted-foreground mb-4">
                        <span className="font-bold text-primary">{featuredBlog.category}</span>
                        <span className="flex items-center gap-1"><Calendar className="size-3" /> {featuredBlog.date}</span>
                        <span className="flex items-center gap-1"><Clock className="size-3" /> {featuredBlog.readingTime}</span>
                      </div>
                      <h2 className="font-display text-3xl md:text-5xl uppercase tracking-tight mb-4 group-hover:text-primary transition-colors">
                        {featuredBlog.title}
                      </h2>
                      <p className="text-muted-foreground font-jetbrains mb-8 line-clamp-3">
                        {featuredBlog.excerpt}
                      </p>
                      <div className="flex items-center gap-2 font-jetbrains font-bold uppercase tracking-wider text-sm group-hover:translate-x-2 transition-transform">
                        Read Article <ChevronRight className="size-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Latest Articles */}
            {remainingBlogs.length > 0 && (
              <div>
                <h3 className="font-display text-3xl uppercase tracking-wider mb-8">
                  Latest Articles
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {remainingBlogs.map((blog) => (
                    <Link key={blog.slug} href={`/blogs/${blog.slug}`} className="group flex flex-col bg-background border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all h-full">
                      <div className="aspect-[16/9] overflow-hidden relative">
                        <img
                          src={blog.coverImage}
                          alt={blog.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm text-foreground text-[10px] font-jetbrains uppercase px-2 py-1 rounded-sm font-bold tracking-widest border border-border">
                          {blog.category}
                        </div>
                      </div>
                      <div className="p-6 flex flex-col flex-grow">
                        <h4 className="font-display text-xl uppercase tracking-tight mb-3 group-hover:text-primary transition-colors line-clamp-2">
                          {blog.title}
                        </h4>
                        <p className="text-sm text-muted-foreground font-jetbrains mb-6 line-clamp-3 flex-grow">
                          {blog.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-xs font-jetbrains uppercase tracking-wider text-muted-foreground mt-auto pt-4 border-t border-border/50">
                          <span className="flex items-center gap-1"><Clock className="size-3" /> {blog.readingTime}</span>
                          <span className="text-foreground font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">Read <ChevronRight className="size-3" /></span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
