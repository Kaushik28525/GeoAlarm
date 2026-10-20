
import { useState } from 'react';
import {
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function NotificationTestScreen() {
  const [status, setStatus] = useState('Ready to test');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>GeoAlarm Notification Test</Text>

      <Button
        title="Check Test Screen"
        onPress={() => setStatus('SUCCESS! The button is working.')}
      />

      <View style={styles.statusBox}>
        <Text style={styles.status}>{status}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0F1117',
    padding: 24,
    gap: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: 'bold',
  },
  statusBox: {
    backgroundColor: '#252936',
    padding: 16,
    borderRadius: 12,
  },
  status: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});
