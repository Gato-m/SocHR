import { StyleSheet, View } from 'react-native';
import { Title } from '../globalStyles/index';

export default function Header() {
  return (
    <View style={styles.header}>
      <Title style={styles.title2}>Personāls</Title>
    </View>
  );
}

const styles = StyleSheet.create({
  title2: {
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
});
