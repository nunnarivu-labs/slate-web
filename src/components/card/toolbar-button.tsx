export const ToolbarButton = ({
  children,
  tooltip,
}: {
  children: React.ReactNode;
  tooltip: string;
}) => {
  return (
    <button className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors group relative">
      {children}
      <span className="absolute bottom-[-30px] left-1/2 -translate-x-1/2 bg-zinc-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
        {tooltip}
      </span>
    </button>
  );
};
