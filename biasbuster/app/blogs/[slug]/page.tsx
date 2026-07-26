import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "../../component/Navbar";
import { Footer } from "../../component/Footer";
import { blogs } from "../../../data/blogs";
import { ArrowLeft, Calendar, Clock, User, ExternalLink } from "lucide-react";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const blog = blogs.find((b) => b.slug === slug);
  if (!blog) return { title: "Blog Not Found | BiasBuster" };

  return {
    title: `${blog.title} | BiasBuster`,
    description: blog.excerpt,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const blog = blogs.find((b) => b.slug === slug);

  if (!blog) {
    notFound();
  }

  // Find some related blogs (just picking first 2 from same category, excluding current)
  const relatedBlogs = blogs
    .filter((b) => b.category === blog.category && b.slug !== blog.slug)
    .slice(0, 2);

  return (
    <div className="min-h-screen flex flex-col text-foreground bg-noise-light bg-repeat bg-[size:10px_10px] bg-center w-full">
      <Navbar />

      <main className="flex-grow container mx-auto px-6 pt-32 pb-24">
        <div className="max-w-3xl mx-auto">
          {/* Back Navigation */}
          <Link
            href="/blogs"
            className="inline-flex items-center gap-2 text-sm font-jetbrains uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mb-12"
          >
            <ArrowLeft className="size-4" /> Back to Blogs
          </Link>

          {/* Header */}
          <header className="mb-12">
            <div className="mb-6">
              <span className="bg-foreground text-background text-xs font-jetbrains uppercase px-3 py-1 rounded-sm font-bold tracking-widest">
                {blog.category}
              </span>
            </div>
            
            <h1 className="font-display text-4xl md:text-6xl uppercase tracking-tighter mb-6">
              {blog.title}
            </h1>
            
            <p className="text-xl text-muted-foreground font-jetbrains mb-8">
              {blog.excerpt}
            </p>

            <div className="flex flex-wrap items-center gap-6 text-sm font-jetbrains uppercase tracking-wider text-muted-foreground border-y border-border py-4">
              <span className="flex items-center gap-2 text-foreground font-bold">
                <User className="size-4" /> {blog.author}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="size-4" /> {blog.date}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="size-4" /> {blog.readingTime}
              </span>
            </div>
          </header>

          {/* Hero Image */}
          <div className="mb-16 aspect-video rounded-xl overflow-hidden border border-border shadow-lg">
            <img
              src={blog.coverImage}
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content Area */}
          <article className="prose prose-lg dark:prose-invert prose-slate font-jetbrains max-w-none prose-headings:font-display prose-headings:uppercase prose-headings:tracking-tight prose-a:text-primary hover:prose-a:text-primary/80 mb-12" dangerouslySetInnerHTML={{ __html: blog.content }}>
          </article>

          {/* Original Article Link */}
          {blog.originalUrl && (
            <div className="mb-20">
              <a href={blog.originalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background font-jetbrains font-bold uppercase tracking-wider text-sm hover:opacity-90 transition-opacity rounded-sm">
                Read Original Article <ExternalLink className="size-4" />
              </a>
            </div>
          )}

          {/* Footer / Related Articles */}
          <div className="border-t border-border pt-12">
            <h3 className="font-display text-2xl uppercase tracking-wider mb-8">
              Related Articles
            </h3>
            
            {relatedBlogs.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {relatedBlogs.map((related) => (
                  <Link key={related.slug} href={`/blogs/${related.slug}`} className="group flex flex-col bg-background border border-border rounded-xl overflow-hidden hover:shadow-md transition-all">
                    <div className="aspect-video overflow-hidden">
                      <img src={related.coverImage} alt={related.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-4">
                      <h4 className="font-display text-lg uppercase tracking-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {related.title}
                      </h4>
                      <p className="text-xs text-muted-foreground font-jetbrains line-clamp-2">
                        {related.excerpt}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-muted/30 rounded-lg">
                <p className="font-jetbrains text-sm text-muted-foreground uppercase tracking-wider mb-4">No related articles found.</p>
                <Link href="/blogs" className="inline-flex items-center gap-2 font-jetbrains font-bold uppercase tracking-wider text-sm hover:translate-x-2 transition-transform">
                  Back to All Blogs <ArrowLeft className="size-4 rotate-180" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
