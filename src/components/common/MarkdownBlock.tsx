type MarkdownBlockProps = {
  content: string;
};

export const MarkdownBlock = ({ content }: MarkdownBlockProps) => (
  <div className="prose prose-invert max-w-none mb-8 text-stone-300">
    {content.split('\n').map((line, i) => {
      if (line.startsWith('##')) {
        return (
          <h2 key={i} className="text-xl font-bold text-green-400 mt-6 mb-3">
            {line.replace('##', '')}
          </h2>
        );
      }
      if (line.startsWith('-')) {
        return (
          <li key={i} className="ml-4 list-disc">
            {line.replace('-', '')}
          </li>
        );
      }
      if (line.trim() === '') {
        return <br key={i} />;
      }
      return (
        <p key={i} className="mb-2 leading-relaxed">
          {line}
        </p>
      );
    })}
  </div>
);
