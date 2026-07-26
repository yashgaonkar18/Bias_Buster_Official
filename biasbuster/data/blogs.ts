export interface Author {
  name: string;
  role: string;
  avatar?: string;
}

export interface BlogPost {
  title: string;
  slug: string;
  excerpt: string;
  category: "AI Fairness" | "Bias Detection" | "Responsible AI" | "Machine Learning" | "Engineering";
  date: string;
  readingTime: string;
  coverImage: string;
  featured: boolean;
  author: Author;
  content: string;
}

export const CATEGORIES = [
  "All",
  "AI Fairness",
  "Bias Detection",
  "Responsible AI",
  "Machine Learning",
  "Engineering",
] as const;

export type Category = (typeof CATEGORIES)[number];

const DEFAULT_AUTHOR: Author = {
  name: "BiasBuster Research Lab",
  role: "AI Safety & Audit Engineering Team",
};

export const BLOG_POSTS: BlogPost[] = [
  {
    title: "Detecting Algorithmic Bias in Large Language Models",
    slug: "detecting-algorithmic-bias-in-llms",
    excerpt: "Explore key techniques and frameworks for evaluating fairness, mitigating demographic disparity, and auditing production AI models before deployment.",
    category: "AI Fairness",
    date: "Jul 24, 2026",
    readingTime: "6 min read",
    coverImage: "/blog/featured-llm-bias.svg",
    featured: true,
    author: {
      name: "Dr. Aris Thorne",
      role: "Head of AI Safety Research",
    },
    content: `
As Large Language Models (LLMs) become deeply embedded in financial services, healthcare, hiring, and legal systems, ensuring algorithmic fairness is no longer optional—it is a core engineering requirement.

## Understanding LLM Disparity Metrics

Traditional machine learning fairness metrics such as demographic parity and equalized odds must be adapted for open-ended generative language models.

### Key Evaluation Areas:
- **Demographic Representation**: Analyzing frequency and sentiment distributions across protected attributes.
- **Stereotype Amplification**: Measuring propensity to associate specific demographics with specialized professions or attributes.
- **Counterfactual Fairness**: Comparing output probability shifts when perturbing demographic indicators in prompt inputs.

## Benchmark Metrics Comparison

| Metric | Focus Area | Recommended Threshold | Audit Frequency |
| :--- | :--- | :--- | :--- |
| Disparate Impact Ratio | Demographic Parity | 0.80 - 1.25 | Per Deployment |
| Equal Opportunity Difference | True Positive Balance | < 0.05 | Weekly Automated |
| Toxicity Shift Score | Prompt Vulnerability | < 0.02 | Real-time Guardrail |

> "Fairness in automated decision systems is not a one-time static check, but an continuous operational feedback loop embedded directly into CI/CD pipelines."

## Implementation Code Example

Below is a Python snippet using standard statistical testing to measure demographic disparity across model predictions:

\`\`\`python
def calculate_disparate_impact(predictions: list[int], protected_group: list[int]) -> float:
    """
    Calculates Disparate Impact Ratio between protected and unprotected groups.
    """
    unprotected_pass = sum(p for p, g in zip(predictions, protected_group) if g == 0)
    unprotected_total = sum(1 for g in protected_group if g == 0)
    
    protected_pass = sum(p for p, g in zip(predictions, protected_group) if g == 1)
    protected_total = sum(1 for g in protected_group if g == 1)

    rate_unprotected = unprotected_pass / max(unprotected_total, 1)
    rate_protected = protected_pass / max(protected_total, 1)

    return rate_protected / max(rate_unprotected, 1e-6)
\`\`\`

## Recommended Mitigation Workflow

1. **Pre-training Dataset Balancing**: Filtering and re-weighting corpus distributions.
2. **In-Context Guardrails**: Dynamic prompt augmentation and rule-based output auditing.
3. **Automated Continuous Benchmarking**: Integrating automated regression tests into your deployment pipeline.

For more details on implementing real-time evaluation, review our comprehensive [BiasBuster Documentation](/#docs).
    `.trim(),
  },
  {
    title: "Continuous Compliance in Automated ML Pipelines",
    slug: "continuous-compliance-ml-pipelines",
    excerpt: "How modern data engineering teams automate fairness checks during CI/CD to prevent subtle bias drift.",
    category: "Bias Detection",
    date: "Jul 18, 2026",
    readingTime: "4 min read",
    coverImage: "/blog/continuous-compliance.svg",
    featured: false,
    author: {
      name: "Elena Rostova",
      role: "Lead MLOps Architect",
    },
    content: `
Automating ML pipeline compliance requires continuous monitoring of data drift, model performance metrics, and demographic disparity ratios across training iterations.

## Why CI/CD Compliance Matters

In rapid model deployment cycles, subtle dataset changes can introduce bias drift without decreasing overall accuracy.

### Core Architecture Steps:
1. **Automated Data Validation**: Intercept training datasets before build.
2. **Fairness Assertion Testing**: Fail build pipelines if disparity exceeds thresholds.
3. **Audit Trail Logging**: Generate verifiable compliance logs for governance.

> "Treating fairness tests with the same rigor as integration tests prevents silent regressions in production."
    `.trim(),
  },
  {
    title: "Uncovering Hidden Representational Bias in Training Data",
    slug: "uncovering-hidden-representational-bias",
    excerpt: "A practical deep-dive into statistical sampling methods for identifying skewed distributions in training datasets.",
    category: "AI Fairness",
    date: "Jul 10, 2026",
    readingTime: "5 min read",
    coverImage: "/blog/representational-bias.svg",
    featured: false,
    author: DEFAULT_AUTHOR,
    content: `
Understanding how data collection protocols inadvertently introduce systematic bias into downstream AI representations.

## Key Statistical Sampling Techniques

To detect underrepresented sub-populations before training starts:

- **Stratified Audit Sampling**: Partitioning dataset features into protected demographic strata.
- **Semantic Embedding Clustering**: Clustering text/image embeddings to locate zero-density regions.
    `.trim(),
  },
  {
    title: "Architecting Low-Latency Real-Time Bias Guardrails",
    slug: "architecting-low-latency-bias-guardrails",
    excerpt: "Design patterns for intercepting prompt outputs without degrading inference throughput or API latency.",
    category: "Engineering",
    date: "Jun 28, 2026",
    readingTime: "8 min read",
    coverImage: "/blog/low-latency-guardrails.svg",
    featured: false,
    author: {
      name: "Marcus Vance",
      role: "Principal Infrastructure Engineer",
    },
    content: `
High-performance architectural patterns for real-time safety and fairness filters in production inference pipelines.

## Architectural Trade-offs

\`\`\`
[ User Prompt ] --> [ Edge Proxy ] --> [ Guardrail Engine (p99 < 5ms) ] --> [ LLM Inference ]
\`\`\`

### Key Performance Metrics:
- **P99 Overhead**: Less than 5ms
- **Memory Footprint**: < 256MB in WASM environment
- **Cache Hit Ratio**: > 94% on common prompt templates
    `.trim(),
  },
  {
    title: "Ethical Frameworks for Enterprise Generative AI",
    slug: "ethical-frameworks-enterprise-genai",
    excerpt: "Guiding principles and operational standards for deploying generative AI models responsibly across orgs.",
    category: "Responsible AI",
    date: "Jun 15, 2026",
    readingTime: "6 min read",
    coverImage: "/blog/ethical-frameworks.svg",
    featured: false,
    author: DEFAULT_AUTHOR,
    content: `
Establishing operational governance, compliance audit trails, and responsible AI guardrails across enterprise engineering organizations.
    `.trim(),
  },
  {
    title: "Evaluating Demographic Disparity Metrics in Credit Scoring",
    slug: "demographic-disparity-credit-scoring",
    excerpt: "Analyzing equal opportunity and disparate impact ratios in automated financial decision systems.",
    category: "Machine Learning",
    date: "Jun 02, 2026",
    readingTime: "7 min read",
    coverImage: "/blog/disparity-metrics.svg",
    featured: false,
    author: DEFAULT_AUTHOR,
    content: `
A technical evaluation of algorithmic decision-making systems in credit underwriting and risk assessment.
    `.trim(),
  },
  {
    title: "Building Automated Bias Regression Test Suites",
    slug: "automated-bias-regression-test-suites",
    excerpt: "How to integrate automated bias regression test suites directly into your developer workflows.",
    category: "Engineering",
    date: "May 24, 2026",
    readingTime: "5 min read",
    coverImage: "/blog/regression-test-suites.svg",
    featured: false,
    author: DEFAULT_AUTHOR,
    content: `
Strategies for embedding fairness unit tests and regression assertions directly into modern CI pipelines.
    `.trim(),
  },
];
