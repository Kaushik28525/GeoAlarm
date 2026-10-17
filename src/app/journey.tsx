import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TravelMap from "../components/travel-map";

type DestinationResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

type SelectedDestination = {
  latitude: number;
  longitude: number;
  displayName: string;
};

const ALARM_OPTIONS = [5, 10, 20, 30];

export default function JourneyScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    destination?: string | string[];
  }>();

  const initialDestination = Array.isArray(params.destination)
    ? (params.destination[0] ?? "")
    : (params.destination ?? "");

  const [destination, setDestination] = useState(initialDestination);
  const [results, setResults] = useState<DestinationResult[]>([]);
  const [selectedDestination, setSelectedDestination] =
    useState<SelectedDestination | null>(null);
  const [selectedMinutes, setSelectedMinutes] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setDestination(initialDestination);
  }, [initialDestination]);

  async function findDestination() {
    const query = destination.trim();

    if (!query) {
      setError("Please enter a destination.");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);
    setSelectedDestination(null);

    try {
      const url =
        "https://nominatim.openstreetmap.org/search" +
        `?format=jsonv2&q=${encodeURIComponent(query)}` +
        "&countrycodes=in&limit=8&addressdetails=1";

      const response = await fetch(url, {
        headers: {
          "Accept-Language": "en",
        },
      });

      if (!response.ok) {
        throw new Error("Search service is temporarily unavailable.");
      }

      const data: DestinationResult[] = await response.json();

      if (data.length === 0) {
        setError(
          "No destination found. Try a more specific name, such as Puri Beach, Odisha.",
        );
      } else {
        setResults(data);
      }
    } catch (err) {
      console.error("Destination search error:", err);
      setError(
        "Could not search right now. Check your internet connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function selectDestination(result: DestinationResult) {
    const latitude = Number(result.lat);
    const longitude = Number(result.lon);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      Math.abs(latitude) > 90 ||
      Math.abs(longitude) > 180
    ) {
      setError("This search result has invalid coordinates. Choose another.");
      return;
    }

    setSelectedDestination({
      latitude,
      longitude,
      displayName: result.display_name,
    });

    setDestination(result.display_name);
    setResults([]);
    setError("");
  }

  function startTravelAlarm() {
    if (!selectedDestination) {
      setError("Please search for and select a destination first.");
      return;
    }

    router.push({
      pathname: "/active-journey",
      params: {
        destination: destination,
        displayName: selectedDestination.displayName,
        latitude: String(selectedDestination.latitude),
        longitude: String(selectedDestination.longitude),
        minutes: String(selectedMinutes),
      },
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
        >
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>

        <Text style={styles.heading}>Plan your journey</Text>
        <Text style={styles.subtitle}>
          Choose your destination and set an alert before you arrive.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>DESTINATION</Text>

          <TextInput
            style={styles.input}
            value={destination}
            onChangeText={(value) => {
              setDestination(value);
              setSelectedDestination(null);
              setResults([]);
              setError("");
            }}
            placeholder="e.g. Puri Beach, Odisha"
            placeholderTextColor="#8B8F9B"
            returnKeyType="search"
            onSubmitEditing={findDestination}
            autoCorrect={false}
          />

          <TouchableOpacity
            style={styles.searchButton}
            onPress={findDestination}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Find Destination</Text>
            )}
          </TouchableOpacity>

          {error !== "" && <Text style={styles.errorText}>{error}</Text>}

          {results.length > 0 && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>Select the correct place</Text>

              {results.map((result) => (
                <TouchableOpacity
                  key={result.place_id}
                  style={styles.resultItem}
                  onPress={() => selectDestination(result)}
                >
                  <Text style={styles.resultIcon}>📍</Text>
                  <Text style={styles.resultText}>{result.display_name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {selectedDestination && (
          <>
            <Text style={styles.sectionTitle}>Selected destination</Text>

            <View style={styles.mapCard}>
              <TravelMap
                latitude={selectedDestination.latitude}
                longitude={selectedDestination.longitude}
                title={selectedDestination.displayName}
              />

              <Text style={styles.coordinates}>
                Latitude: {selectedDestination.latitude.toFixed(6)}
                {"\n"}
                Longitude: {selectedDestination.longitude.toFixed(6)}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Alert me before arrival</Text>

            <View style={styles.alarmOptions}>
              {ALARM_OPTIONS.map((minutes) => {
                const selected = selectedMinutes === minutes;

                return (
                  <TouchableOpacity
                    key={minutes}
                    onPress={() => setSelectedMinutes(minutes)}
                    style={[
                      styles.alarmOption,
                      selected && styles.alarmOptionSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.alarmOptionText,
                        selected && styles.alarmOptionTextSelected,
                      ]}
                    >
                      {minutes} min
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.startButton}
              onPress={startTravelAlarm}
            >
              <Text style={styles.buttonText}>Start Travel Alarm</Text>
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.footer}>
          Search results are provided by OpenStreetMap. An internet connection
          is required to search.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F1117",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    marginBottom: 16,
  },
  backText: {
    color: "#A78BFA",
    fontSize: 16,
    fontWeight: "600",
  },
  heading: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 22,
  },
  card: {
    backgroundColor: "#191C25",
    borderRadius: 18,
    padding: 16,
  },
  label: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#252936",
    color: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    fontSize: 15,
  },
  searchButton: {
    height: 50,
    borderRadius: 12,
    backgroundColor: "#7C5CFC",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 13,
    marginTop: 12,
    lineHeight: 19,
  },
  resultsContainer: {
    marginTop: 18,
  },
  resultsTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#303442",
  },
  resultIcon: {
    fontSize: 17,
    marginRight: 10,
  },
  resultText: {
    color: "#E5E7EB",
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 12,
  },
  mapCard: {
    overflow: "hidden",
    borderRadius: 16,
    backgroundColor: "#191C25",
  },
  coordinates: {
    color: "#9CA3AF",
    fontSize: 12,
    lineHeight: 20,
    padding: 14,
  },
  alarmOptions: {
    flexDirection: "row",
    gap: 8,
  },
  alarmOption: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#252936",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#252936",
  },
  alarmOptionSelected: {
    backgroundColor: "#302454",
    borderColor: "#7C5CFC",
  },
  alarmOptionText: {
    color: "#D1D5DB",
    fontSize: 13,
    fontWeight: "600",
  },
  alarmOptionTextSelected: {
    color: "#C4B5FD",
  },
  startButton: {
    height: 54,
    backgroundColor: "#7C5CFC",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },
  footer: {
    color: "#737987",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 24,
    textAlign: "center",
  },
});
