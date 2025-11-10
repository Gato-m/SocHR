// globalStyles/responsive.js

import { Dimensions } from 'react-native';
import { useEffect, useState } from 'react';

export const useResponsive = () => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions;
  const isTablet = width > 768;
  const isLandscape = width > height;

  return { width, height, isTablet, isLandscape };
};
