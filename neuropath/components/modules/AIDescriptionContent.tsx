"use client";

import ReactMarkdown from "react-markdown";

const markdownComponents = {
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-[15px] font-bold text-foreground mt-5 mb-2 first:mt-0 tracking-tight">
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-[13px] font-semibold text-foreground/95 mt-3.5 mb-1.5">
      {children}
    </h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-[13px] text-foreground/80 leading-[1.7] mb-2.5 last:mb-0">
      {children}
    </p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="space-y-2 mb-3 ml-1">
      {children}
    </ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal pl-5 space-y-2 mb-3 text-[13px] text-foreground/80">
      {children}
    </ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-[13px] text-foreground/80 leading-[1.7] flex gap-2">
      <span className="text-primary-light/60 mt-[2px] shrink-0">•</span>
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="text-foreground/90 italic">{children}</em>
  ),
};

interface AIDescriptionContentProps {
  content: string;
}

export function AIDescriptionContent({ content }: AIDescriptionContentProps) {
  return (
    <div className="ai-description">
      <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
    </div>
  );
}
