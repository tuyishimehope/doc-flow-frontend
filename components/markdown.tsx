"use client";

import { memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/** react-markdown passes its syntax-tree `node`; keep it off the DOM. */
function strip<P extends object>(props: P): Omit<P, "node"> {
  const rest = { ...props } as P & { node?: unknown };
  delete rest.node;
  return rest;
}

// Raw HTML in the text is not rendered (react-markdown's default), so model output
// can't inject markup.
const components: Components = {
  p: (props) => <p {...strip(props)} className={cn("my-3 first:mt-0 last:mb-0", props.className)} />,
  h1: (props) => <h3 {...strip(props)} className={cn("mt-5 mb-2 text-lg font-semibold first:mt-0", props.className)} />,
  h2: (props) => <h3 {...strip(props)} className={cn("mt-5 mb-2 text-base font-semibold first:mt-0", props.className)} />,
  h3: (props) => <h4 {...strip(props)} className={cn("mt-4 mb-1.5 font-semibold first:mt-0", props.className)} />,
  h4: (props) => <h5 {...strip(props)} className={cn("mt-4 mb-1.5 font-semibold first:mt-0", props.className)} />,
  ul: (props) => <ul {...strip(props)} className={cn("my-3 list-disc space-y-1 pl-6 marker:text-subtle", props.className)} />,
  ol: (props) => <ol {...strip(props)} className={cn("my-3 list-decimal space-y-1 pl-6 marker:text-subtle", props.className)} />,
  li: (props) => <li {...strip(props)} className={cn("pl-1 [&>p]:my-1", props.className)} />,
  a: (props) => (
    <a {...strip(props)} target="_blank" rel="noopener noreferrer" className={cn("font-medium text-accent underline underline-offset-2 hover:text-accent-strong", props.className)} />
  ),
  strong: (props) => <strong {...strip(props)} className={cn("font-semibold text-fg", props.className)} />,
  blockquote: (props) => (
    <blockquote {...strip(props)} className={cn("my-3 border-l-2 border-line pl-4 text-muted", props.className)} />
  ),
  hr: () => <hr className="my-5 border-line" />,
  pre: (props) => (
    <pre {...strip(props)} className={cn("my-3 overflow-x-auto rounded-xl border border-line bg-surface-2 p-3.5 text-[13px] leading-relaxed [&>code]:bg-transparent [&>code]:p-0", props.className)} />
  ),
  code: (props) => (
    <code
      {...strip(props)}
      className={cn("rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[0.875em]", props.className)}
    />
  ),
  table: (props) => (
    <div className="my-3 overflow-x-auto rounded-xl border border-line">
      <table {...strip(props)} className={cn("w-full border-collapse text-sm", props.className)} />
    </div>
  ),
  th: (props) => (
    <th {...strip(props)} className={cn("border-b border-line bg-surface-2 px-3 py-2 text-left font-semibold", props.className)} />
  ),
  td: (props) => <td {...strip(props)} className={cn("border-b border-line px-3 py-2 align-top", props.className)} />,
};

/** Renders an assistant answer. Memoised so a streaming answer doesn't re-render older ones. */
export const Markdown = memo(function Markdown({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <div className={cn("text-[15px] leading-relaxed break-words text-fg [&_tr:last-child>td]:border-b-0", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </ReactMarkdown>
    </div>
  );
});
