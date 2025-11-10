// globalStyles/shadows.js
import { Platform } from 'react-native';

export const createShadow = (elevation = 2) => {
  return Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: elevation },
      shadowOpacity: 0.2,
      shadowRadius: elevation * 2,
    },
    android: {
      elevation,
    },
  });
};
