import { StyleSheet, View } from 'react-native';
import { Title } from '../globalStyles/index';
import Soclogo from './soclogo';

export default function Header() {
  return (
    <View style={styles.header}>
      <Soclogo style={{ width: 50, height: 50, marginRight: 16 }} />
      <Title style={styles.title}>Personāls</Title>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 16,
  },
});
