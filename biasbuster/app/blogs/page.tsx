import type { Metadata } from "next";
import BlogsClient from "./BlogsClient";

export const metadata: Metadata = {
  title: "Blogs | BiasBuster",
  description:
    "Insights on AI fairness, responsible machine learning, bias detection, and building more accountable AI systems.",
};

export default function BlogsPage() {
  return <BlogsClient />;
}
