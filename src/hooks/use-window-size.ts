import { useEffect, useState } from 'react';

export const useWindowSize = () => {
  const [width, setWidth] = useState(globalThis.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(globalThis.innerWidth);

    globalThis.addEventListener('resize', handleResize);
    handleResize();

    return () => globalThis.removeEventListener('resize', handleResize);
  }, []);

  return width;
};
