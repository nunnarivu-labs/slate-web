import { useEffect, useRef, useState } from 'react';

type Theme = 'light' | 'dark';

export const useTheme = (): Theme => {
  const mediaMatch = useRef(window.matchMedia('(prefers-color-scheme: dark)'));

  const [theme, setTheme] = useState<Theme>(() =>
    mediaMatch.current?.matches ? 'dark' : 'light',
  );

  useEffect(() => {
    const onMediaChange = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? 'dark' : 'light');
    };

    if (!mediaMatch.current) {
      mediaMatch.current = window.matchMedia('(prefers-color-scheme: dark)');
    }

    mediaMatch.current.addEventListener('change', onMediaChange);

    return () =>
      mediaMatch.current?.removeEventListener('change', onMediaChange);
  }, []);

  return theme;
};
