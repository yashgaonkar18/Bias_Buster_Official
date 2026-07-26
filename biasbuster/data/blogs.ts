export type BlogPost = {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  date: string;
  readingTime: string;
  coverImage: string;
  featured?: boolean;
  content: string; // Markdown or HTML representation conceptually, but for now just raw string/JSX structure
  author: string;
  originalUrl?: string;
};

export const categories = [
  "All",
  "AI Fairness",
  "Bias Detection",
  "Responsible AI",
  "Machine Learning",
  "Engineering",
];

export const blogs: BlogPost[] = [
  {
    title: "Understanding Bias in Machine Learning Models",
    slug: "understanding-bias-in-machine-learning-models",
    excerpt:
      "A deep dive into how bias enters ML pipelines and the steps we can take to mitigate it effectively before deployment.",
    category: "AI Fairness",
    date: "July 12, 2026",
    readingTime: "8 min read",
    coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200",
    featured: true,
    author: "Dr. Elena Rostova",
    originalUrl: "https://dida.do/blog/fairness-in-ml",
    content: `
      <h2>The Anatomy of Algorithmic Bias</h2>
      <p>Machine learning models are only as good as the data they are trained on. When historical data contains human biases, the model will inevitably learn and potentially amplify those prejudices.</p>
      <p>In this article, we explore the lifecycle of a model and pinpoint exactly where bias can be introduced—from data collection to feature engineering and finally in the objective function.</p>
      <p>This is a placeholder excerpt. Please visit the original article for the full content.</p>
    `,
  },
  {
    title: "Fairness in Machine Learning Crash Course",
    slug: "fairness-in-machine-learning-crash-course",
    excerpt:
      "Accountability in AI is not just about fairness metrics; it's about transparency, explainability, and governance.",
    category: "Responsible AI",
    date: "June 28, 2026",
    readingTime: "15 min read",
    coverImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200",
    author: "Google Developers",
    originalUrl: "https://developers.google.com/machine-learning/crash-course/fairness",
    content: `
      <h2>Beyond Fairness Metrics</h2>
      <p>While statistical fairness metrics are crucial, they are only the beginning of accountable AI. True accountability involves a holistic approach to model governance.</p>
      <p>This is a placeholder excerpt. Please visit the original article for the full content.</p>
    `,
  },
  {
    title: "Techniques for Bias Detection in Production",
    slug: "techniques-for-bias-detection-in-production",
    excerpt:
      "Once a model is deployed, how do you ensure it remains fair? An overview of monitoring techniques for production ML.",
    category: "Bias Detection",
    date: "June 15, 2026",
    readingTime: "10 min read",
    coverImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200",
    author: "Labelia Labs",
    originalUrl: "https://www.labelia.org/en/blog/fairness-in-machine-learning",
    content: `
      <h2>Monitoring Fairness in Real-Time</h2>
      <p>Model drift isn't just about accuracy; it's also about fairness. A model that was fair at deployment can become biased over time as the underlying data distribution changes.</p>
      <p>This is a placeholder excerpt. Please visit the original article for the full content.</p>
    `,
  },
  {
    title: "Engineering Robust ML Pipelines with Arthur AI",
    slug: "engineering-robust-ml-pipelines-arthur-ai",
    excerpt:
      "Best practices for incorporating automated fairness checks directly into your CI/CD pipelines for machine learning.",
    category: "Engineering",
    date: "May 22, 2026",
    readingTime: "6 min read",
    coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200",
    author: "Arthur AI",
    originalUrl: "https://www.arthur.ai/blog/fairness-in-ml",
    content: `
      <h2>Fairness as Code</h2>
      <p>Just as we write unit tests for software, we must write fairness tests for models. Integrating these checks into the CI/CD pipeline ensures that no model is promoted to production if it violates predefined fairness constraints.</p>
      <p>This is a placeholder excerpt. Please visit the original article for the full content.</p>
    `,
  },
  {
    title: "What is AI Bias? A Guide by SAP",
    slug: "what-is-ai-bias-sap",
    excerpt:
      "Understanding the foundational concepts of AI bias and how organizations can navigate the complexities of ethical AI.",
    category: "Machine Learning",
    date: "April 10, 2026",
    readingTime: "12 min read",
    coverImage: "https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&q=80&w=1200",
    author: "SAP",
    originalUrl: "https://www.sap.com/resources/what-is-ai-bias",
    content: `
      <h2>Understanding AI Bias</h2>
      <p>AI bias occurs when an algorithm produces results that are systemically prejudiced due to erroneous assumptions in the machine learning process.</p>
      <p>This is a placeholder excerpt. Please visit the original article for the full content.</p>
    `,
  }
];
