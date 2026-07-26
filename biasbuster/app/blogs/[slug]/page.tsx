import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "../../component/Navbar";
import { Footer } from "../../component/Footer";
import { BLOG_POSTS, BlogPost } from "@/data/blogs";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  User,
  Sparkles,
  Brain,
  Cpu,
  ShieldCheck,
  Layers,
  Scale,
  Code,
  CheckCircle2,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "AI Fairness": Brain,
  "Bias Detection": ShieldCheck,
  Engineering: Cpu,
  "Responsible AI": Scale,
  "Machine Learning": Layers,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    return {
      title: "Blog Post Not Found | BiasBuster",
    };
  }

  return {
    title: `${post.title} | BiasBuster`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);
  const IconComponent = CATEGORY_ICONS[post.category] || Code;

  return (
    <div className="min-h-screen text-foreground bg-noise-light bg-repeat bg-[size:10px_10px] bg-center w-full flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Back to Blogs Button */}
          <div className="mb-8">
            <Link
              href="/blogs"
              className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
              Back to Blogs
            </Link>
          </div>

          {/* Article Header Header */}
          <div className="mb-10 text-left">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="bg-[#00FF94] text-black font-mono font-bold text-xs uppercase px-3 py-1 rounded-sm">
                {post.category}
              </span>
              {post.featured && (
                <span className="inline-flex items-center gap-1 bg-zinc-900 text-white font-mono font-bold text-xs uppercase px-2.5 py-1 rounded-sm border border-zinc-700">
                  <Sparkles className="size-3 text-[#00FF94]" />
                  Featured Article
                </span>
              )}
            </div>

            <h1 className="text-4xl md:text-6xl font-anton uppercase tracking-tight text-foreground leading-[1.05] mb-6">
              {post.title}
            </h1>

            <p className="text-base md:text-lg font-jetbrains text-muted-foreground leading-relaxed mb-8">
              {post.excerpt}
            </p>

            {/* Metadata / Author Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-b border-border/80 pb-6 text-xs font-mono">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[#00FF94]">
                  <User className="size-5" />
                </div>
                <div>
                  <div className="font-bold text-foreground uppercase">{post.author.name}</div>
                  <div className="text-muted-foreground text-[11px]">{post.author.role}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  {post.date}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  {post.readingTime}
                </span>
              </div>
            </div>
          </div>

          {/* Hero / Cover Image Placeholder */}
          <div className="mb-14 rounded-2xl bg-zinc-900 border border-border/80 overflow-hidden relative min-h-[320px] md:min-h-[420px] p-8 md:p-12 flex flex-col justify-between shadow-md">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808015_1px,transparent_1px),linear-gradient(to_bottom,#80808015_1px,transparent_1px)] bg-[size:32px_32px]"></div>

            <div className="relative z-10 flex items-center justify-between">
              <span className="font-mono text-xs text-zinc-400 uppercase tracking-widest">
                Cover Image Placeholder
              </span>
              <span className="font-mono text-xs text-zinc-500">1200 x 630</span>
            </div>

            <div className="relative z-10 my-auto py-12 flex items-center justify-center">
              <div className="size-28 rounded-3xl bg-zinc-800/90 border border-zinc-700 flex items-center justify-center shadow-2xl">
                <IconComponent className="size-14 text-[#00FF94]" />
              </div>
            </div>

            <div className="relative z-10 text-center text-xs font-mono text-zinc-400 uppercase tracking-wider">
              {post.title} — Visual Asset
            </div>
          </div>

          {/* Demonstration Content Area (Headings, Paragraphs, Lists, Code, Blockquotes, Tables, Images, Links) */}
          <article className="bg-white rounded-2xl p-8 md:p-12 border border-border/80 shadow-xs space-y-8 text-foreground font-jetbrains text-sm md:text-base leading-relaxed">
            {/* Heading 2 */}
            <h2 className="text-2xl md:text-3xl font-anton uppercase tracking-tight text-foreground pt-2">
              1. Overview & System Objectives
            </h2>

            {/* Paragraph with Link */}
            <p className="text-muted-foreground">
              This demo article demonstrates the layout and supported typography styles for the BiasBuster blog system. In modern AI workflows, evaluating machine learning models requires continuous verification against bias drift and demographic disparity metrics. Learn more on our{" "}
              <a href="/#features" className="text-foreground font-bold underline decoration-2 underline-offset-4 hover:text-primary transition-colors">
                BiasBuster Platform Feature Guide
              </a>.
            </p>

            {/* Heading 3 */}
            <h3 className="text-xl md:text-2xl font-display font-semibold text-foreground pt-4">
              Key Evaluation Pillars
            </h3>

            {/* Bullet List */}
            <div className="bg-zinc-50 p-6 rounded-xl border border-border/60">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground mb-3 block">
                Required Audit Criteria (Unordered List):
              </span>
              <ul className="space-y-2.5 text-muted-foreground list-none pl-0">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-[#00FF94] mt-1 shrink-0" />
                  <span><strong>Demographic Parity:</strong> Equal acceptance rates across demographic groups.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-[#00FF94] mt-1 shrink-0" />
                  <span><strong>Equal Opportunity:</strong> Matching true positive rates across subsets.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-[#00FF94] mt-1 shrink-0" />
                  <span><strong>Toxicity & Bias Shift:</strong> Real-time token output verification.</span>
                </li>
              </ul>
            </div>

            {/* Numbered List */}
            <h3 className="text-xl md:text-2xl font-display font-semibold text-foreground pt-4">
              Implementation Roadmap
            </h3>
            <ol className="list-decimal list-inside space-y-3 text-muted-foreground font-jetbrains pl-2">
              <li>Partition training datasets into demographic strata.</li>
              <li>Execute automated regression tests during model compilation.</li>
              <li>Deploy real-time guardrails to edge proxy inference servers.</li>
              <li>Publish continuous compliance reports to internal audit logs.</li>
            </ol>

            {/* Blockquote */}
            <blockquote className="border-l-4 border-[#00FF94] bg-zinc-900 text-white p-6 rounded-r-xl my-8 font-mono text-sm leading-relaxed">
              &ldquo;Automated fairness verification ensures system accountability without sacrificing inference throughput or engineering velocity.&rdquo;
              <span className="block mt-3 text-xs text-zinc-400 uppercase tracking-widest font-bold">
                — BiasBuster Architecture Standard
              </span>
            </blockquote>

            {/* Table Support */}
            <h3 className="text-xl md:text-2xl font-display font-semibold text-foreground pt-4">
              Benchmark Threshold Table
            </h3>
            <div className="overflow-x-auto my-6 border border-border rounded-xl">
              <table className="w-full text-left text-xs md:text-sm font-mono">
                <thead className="bg-zinc-900 text-white uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">Metric Name</th>
                    <th className="py-3.5 px-4 font-bold">Target Range</th>
                    <th className="py-3.5 px-4 font-bold">Audit Frequency</th>
                    <th className="py-3.5 px-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white text-muted-foreground">
                  <tr>
                    <td className="py-3 px-4 font-bold text-foreground">Disparate Impact Ratio</td>
                    <td className="py-3 px-4">0.80 - 1.25</td>
                    <td className="py-3 px-4">Per Build</td>
                    <td className="py-3 px-4 text-[#00FF94] font-bold">PASS</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-foreground">Equalized Odds Diff</td>
                    <td className="py-3 px-4">&lt; 0.05</td>
                    <td className="py-3 px-4">Daily Automated</td>
                    <td className="py-3 px-4 text-[#00FF94] font-bold">PASS</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-foreground">Toxicity Shift Score</td>
                    <td className="py-3 px-4">&lt; 0.02</td>
                    <td className="py-3 px-4">Real-time Stream</td>
                    <td className="py-3 px-4 text-[#00FF94] font-bold">MONITORED</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Image Support */}
            <h3 className="text-xl md:text-2xl font-display font-semibold text-foreground pt-4">
              Visual Architecture Diagram
            </h3>
            <div className="my-6 border border-border/80 rounded-xl overflow-hidden bg-zinc-900 p-8 text-center">
              <div className="h-44 bg-zinc-800 rounded-lg border border-zinc-700/80 flex items-center justify-center max-w-lg mx-auto">
                <span className="font-mono text-xs text-[#00FF94] uppercase tracking-widest font-bold">
                  [ Image Placeholder: Architecture Diagram ]
                </span>
              </div>
              <p className="text-xs font-mono text-zinc-400 mt-4 italic">
                Figure 1.1: Automated continuous compliance pipeline integration within CI/CD workflows.
              </p>
            </div>

            {/* Code Block Support */}
            <h3 className="text-xl md:text-2xl font-display font-semibold text-foreground pt-4">
              Sample Code Block
            </h3>
            <div className="my-6 rounded-xl bg-zinc-900 border border-zinc-800 p-5 overflow-x-auto">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-3 pb-2 border-b border-zinc-800">
                <span>bias_checker.py</span>
                <span>Python 3.11</span>
              </div>
              <pre className="text-xs md:text-sm font-mono text-zinc-200 leading-relaxed">
{`def evaluate_fairness(predictions: list, protected_attr: list) -> float:
    # Compute demographic ratio
    group_a = [p for p, a in zip(predictions, protected_attr) if a == 0]
    group_b = [p for p, a in zip(predictions, protected_attr) if a == 1]
    
    rate_a = sum(group_a) / max(len(group_a), 1)
    rate_b = sum(group_b) / max(len(group_b), 1)
    
    return rate_b / max(rate_a, 1e-6)`}
              </pre>
            </div>

            {/* Additional Article Raw Text */}
            <div className="pt-4 border-t border-border/60">
              <p className="text-muted-foreground whitespace-pre-line">
                {post.content}
              </p>
            </div>
          </article>

          {/* Related Articles Section */}
          <div className="mt-20 pt-12 border-t border-border/80">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-anton uppercase tracking-tight text-foreground">
                Related Articles
              </h2>
              <Link
                href="/blogs"
                className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
              >
                View All
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relPost) => {
                const RelIconComponent = CATEGORY_ICONS[relPost.category] || Code;
                return (
                  <div
                    key={relPost.slug}
                    className="bg-white rounded-2xl border border-border/80 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all duration-300 group"
                  >
                    <div className="h-40 bg-zinc-900 relative p-5 flex flex-col justify-between overflow-hidden">
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:16px_16px]"></div>

                      <div className="relative z-10">
                        <span className="bg-white/10 backdrop-blur-md text-white border border-white/20 font-mono text-[9px] font-bold uppercase px-2 py-0.5 rounded-sm">
                          {relPost.category}
                        </span>
                      </div>

                      <div className="relative z-10 flex items-center justify-center my-auto">
                        <div className="size-12 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[#00FF94] group-hover:scale-110 transition-transform">
                          <RelIconComponent className="size-6" />
                        </div>
                      </div>

                      <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                        <span>{relPost.date}</span>
                        <span>{relPost.readingTime}</span>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between bg-white">
                      <div>
                        <Link href={`/blogs/${relPost.slug}`}>
                          <h3 className="text-base font-display font-semibold text-foreground mb-2 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                            {relPost.title}
                          </h3>
                        </Link>
                        <p className="text-xs font-jetbrains text-muted-foreground leading-relaxed mb-4 line-clamp-2">
                          {relPost.excerpt}
                        </p>
                      </div>

                      <Link
                        href={`/blogs/${relPost.slug}`}
                        className="inline-flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-wider text-foreground hover:underline underline-offset-4"
                      >
                        Read Article
                        <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Back to All Blogs Button */}
          <div className="mt-16 text-center">
            <Button asChild size="lg" className="bg-foreground text-background hover:bg-foreground/90 font-mono text-xs uppercase tracking-wider group px-8">
              <Link href="/blogs">
                <ArrowLeft className="size-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to All Blogs
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
