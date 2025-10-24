export const components = {
  ul: ({ node, ...props }: any) => {
    return <ul className="list-disc" {...props} />;
  },
  ol: ({ node, ...props }: any) => {
    return <ul className="list-decimal" {...props} />;
  },
};
