// globalStyles/commonStyles.js

import { StyleSheet } from 'react-native';

export const flexPatterns = StyleSheet.create({
  // Container patterns
  row: {
    flexDirection: 'row',
  },
  column: {
    flexDirection: 'column',
  },
  textCenter: {
    textAlign: 'center',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    // flexDirection: 'column',
    // flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },

  // Child patterns
  flex1: {
    flex: 1,
  },
  alignSelfCenter: {
    alignSelf: 'center',
  },
});
