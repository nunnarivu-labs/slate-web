import {
  Children,
  ReactNode,
  ViewTransition,
  useLayoutEffect,
  useRef,
} from 'react';

type MasonryGridProps = {
  children: ReactNode;
};

export const MasonryGrid = ({ children }: MasonryGridProps) => {
  const gridRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const items = Array.from(grid.children) as HTMLDivElement[];
    const layout = () => {
      const styles = getComputedStyle(grid);
      const columnWidths = styles.gridTemplateColumns
        .split(' ')
        .map(parseFloat);

      if (
        !columnWidths.length ||
        columnWidths.some((width) => !Number.isFinite(width))
      ) {
        return;
      }

      const gap = parseFloat(styles.columnGap) || 0;
      const columnHeights = columnWidths.map(() => 0);

      // Measure at the final column width before choosing the shortest column.
      items.forEach((item) => {
        item.style.position = 'absolute';
        item.style.width = `${columnWidths[0]}px`;
      });

      const heights = items.map((item) => item.getBoundingClientRect().height);

      items.forEach((item, index) => {
        const shortestHeight = Math.min(...columnHeights);
        const column = columnHeights.indexOf(shortestHeight);
        item.style.left = `${columnWidths.slice(0, column).reduce((sum, width) => sum + width + gap, 0)}px`;
        item.style.top = `${shortestHeight}px`;
        columnHeights[column] += heights[index] + gap;
      });

      grid.style.height = `${Math.max(0, ...columnHeights) - (items.length ? gap : 0)}px`;
    };

    layout();

    const observer = new ResizeObserver(layout);
    observer.observe(grid);

    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [children]);

  return (
    <div
      ref={gridRef}
      className="relative grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5"
    >
      {Children.map(children, (child) => (
        <ViewTransition
          enter="note-card-enter"
          exit="note-card-exit"
          update="note-card-update"
        >
          <div>{child}</div>
        </ViewTransition>
      ))}
    </div>
  );
};
