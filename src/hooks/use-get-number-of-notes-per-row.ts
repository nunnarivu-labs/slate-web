import { useWindowSize } from '@/hooks/use-window-size.ts';

export const useGetNumberOfNotesPerRow = () => {
  const width = useWindowSize();

  if (width >= 1536) return 6;
  if (width >= 1280) return 5;
  if (width >= 1024) return 4;
  if (width >= 768) return 3;
  if (width >= 640) return 2;
  return 1;
};
