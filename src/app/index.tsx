import { useRouter } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const [destination, setDestination] = useState("");
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>GeoAlarm</Text>
          <Text style={styles.subtitle}>Never miss your stop again.</Text>
        </View>

        {/* Main Card */}
        <View style={styles.card}>
          <Text style={styles.question}>Where are you going?</Text>

          <Text style={styles.label}>Destination</Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. Puri Beach"
            placeholderTextColor="#8B8B93"
            value={destination}
            onChangeText={setDestination}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              if (!destination.trim()) {
                return;
              }

              router.push({
                pathname: "/journey",
                params: {
                  destination: destination.trim(),
                },
              });
            }}
          >
            <Text style={styles.buttonText}>Start Journey</Text>
          </TouchableOpacity>
        </View>

        {/* Recent destinations */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent destinations</Text>

          <View style={styles.recentRow}>
            <TouchableOpacity
              style={styles.placeCard}
              onPress={() => setDestination("Puri Beach")}
            >
              <Text style={styles.placeIcon}>📍</Text>
              <Text style={styles.placeName}>Puri Beach</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.placeCard}
              onPress={() => setDestination("Cuttack")}
            >
              <Text style={styles.placeIcon}>📍</Text>
              <Text style={styles.placeName}>Cuttack</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, { marginBottom: 16 }]}
          onPress={() => router.push("/notification-test")}
        >
          <Text style={styles.buttonText}>
            Open Notification Test
          </Text>
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>😴</Text>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Sleep while you travel</Text>
            <Text style={styles.infoText}>
              We'll alert you before you reach your destination.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F1117",
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },

  header: {
    marginBottom: 30,
  },

  logo: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 16,
    color: "#9CA3AF",
  },

  card: {
    backgroundColor: "#191C25",
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
  },

  question: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 8,
  },

  input: {
    height: 54,
    borderRadius: 14,
    backgroundColor: "#252936",
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 16,
  },

  button: {
    height: 54,
    borderRadius: 14,
    backgroundColor: "#7C5CFC",
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  recentSection: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
  },

  recentRow: {
    flexDirection: "row",
    gap: 12,
  },

  placeCard: {
    flex: 1,
    backgroundColor: "#191C25",
    borderRadius: 16,
    padding: 16,
  },

  placeIcon: {
    fontSize: 22,
    marginBottom: 8,
  },

  placeName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },

  infoBox: {
    flexDirection: "row",
    backgroundColor: "#171A22",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },

  infoIcon: {
    fontSize: 28,
    marginRight: 14,
  },

  infoTextContainer: {
    flex: 1,
  },

  infoTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },

  infoText: {
    color: "#9CA3AF",
    fontSize: 13,
    lineHeight: 19,
  },
});
