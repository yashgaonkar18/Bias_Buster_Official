"use client";
import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react'; 

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: 1,
    question: 'What is the primary goal of the Bias Buster project?',
    answer: 'Bias Buster is designed to proactively identify and mitigate systemic and implicit biases within organizational processes, decision-making algorithms (e.g., hiring, lending), and customer-facing AI models to ensure fair and equitable outcomes for all groups.',
  },
  {
    id: 2,
    question: 'How does Bias Buster identify different types of bias?',
    answer: 'We employ a multi-faceted approach, including statistical parity checks on output data, counterfactual analysis to test model robustness, and qualitative reviews of input data sources to detect historical or representation bias before it is encoded.',
  },
  {
    id: 3,
    question: 'Is the data used for bias auditing kept confidential?',
    answer: 'Absolutely. All sensitive data used for auditing is anonymized and processed in a secure, isolated environment. We adhere strictly to data governance policies to ensure no personally identifiable information is stored or misused.',
  },
  {
    id: 4,
    question: 'What happens after a bias is detected in a system?',
    answer: 'Once a bias is detected, the system generates a detailed mitigation report. Our team then works with relevant stakeholders (e.g., engineering, HR) to apply debiasing techniques, which may involve data rebalancing, model recalibration, or process redesign.',
  },
];


interface ChevronProps {
    isOpen: boolean;
}

const AnimatedChevron: React.FC<ChevronProps> = ({ isOpen }) => (
  <span 
    className={`p-1 border border-white/20 rounded-full transition-all duration-300 flex items-center justify-center flex-shrink-0 ${
        isOpen ? 'bg-[#00FF94] border-[#00FF94] text-black rotate-90' : 'bg-transparent text-white'
    }`}
  >
    <ChevronRight className="size-4" />
  </span>
);

export default function Faq() {
  const [openId, setOpenId] = useState<number | null>(null);

  const toggleFAQ = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section className="py-24 relative bg-black text-white overflow-hidden">
      <div className="container mx-auto px-4 z-10 max-w-4xl">
        <div className="text-center mb-16">
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#00FF94] mb-3">
            PROJECT INSIGHTS
          </p>
          <h2 className="text-5xl md:text-7xl font-anton uppercase leading-[0.9] tracking-tight">
            BiasBuster FAQ
          </h2>
        </div>
        
        <div className="space-y-4">
          {FAQ_DATA.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className={`
                    border-b-2 border-white/10
                    ${isOpen ? 'bg-white/5 backdrop-blur-sm' : 'hover:bg-white/5 transition-colors duration-200'}
                    rounded-lg
                `}
              >
                {/* Question Button (The Trigger) */}
                <button
                  className="flex justify-between items-center w-full py-5 px-6 text-left focus:outline-none"
                  onClick={() => toggleFAQ(item.id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-content-${item.id}`}
                >
                  <span className={`text-xl font-semibold ${isOpen ? 'text-[#00FF94]' : 'text-white'}`}>
                    {item.question}
                  </span>
                  <AnimatedChevron isOpen={isOpen} />
                </button>

                <div
                  id={`faq-content-${item.id}`}
                  className={`
                    transition-all ease-in-out duration-300 
                    ${isOpen 
                        ? 'max-h-96 opacity-100 py-6 px-6 border-t border-white/10' 
                        : 'max-h-0 opacity-0 p-0'
                    } 
                    overflow-hidden
                  `}
                  role="region"
                >
                  <p className="font-mono text-sm tracking-wide text-white/80">
                    {item.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}