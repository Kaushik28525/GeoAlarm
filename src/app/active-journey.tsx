
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TravelMap from "../components/travel-map";

type GPSPoint = {
  latitude: number;
  longitude: number;
};

function getParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

// Calculate straight-line distance between two GPS points.
function calculateDistanceKm(from: GPSPoint, to: GPSPoint): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const latDifference = toRadians(to.latitude - from.latitude);
  const lonDifference = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(latDifference / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(lonDifference / 2) ** 2;

  const safeA = Math.min(1, Math.max(0, a));

  return (
    earthRadiusKm *
    2 *
    Math.atan2(Math.sqrt(safeA), Math.sqrt(1 - safeA))
  );
}

export default function ActiveJourneyScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    destination?: string | string[];
    minutes?: string | string[];
    latitude?: string | string[];
    longitude?: string | string[];
    displayName?: string | string[];
  }>();

  const destination = getParam(params.destination) || "Your destination";
  const displayName = getParam(params.displayName) || destination;
  const alarmMinutes = Math.max(
    0,
    Number(getParam(params.minutes)) || 10
  );

  const destinationLatitude = Number(getParam(params.latitude));
  const destinationLongitude = Number(getParam(params.longitude));

  const hasDestinationCoordinates =
    getParam(params.latitude) !== "" &&
    getParam(params.longitude) !== "" &&
    Number.isFinite(destinationLatitude) &&
    Number.isFinite(destinationLongitude) &&
    Math.abs(destinationLatitude) <= 90 &&
    Math.abs(destinationLongitude) <= 180;

  const [currentLocation, setCurrentLocation] =
    useState<GPSPoint | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [locationMessage, setLocationMessage] = useState(
    "Getting your current location..."
  );
  const [isTracking, setIsTracking] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let subscription: Location.LocationSubscription | null = null;

    async function startTracking() {
      try {
        const permission =
          await Location.requestForegroundPermissionsAsync();

        if (!permission.granted) {
          if (isMounted) {
            setLocationMessage(
              "Location permission is required to track your journey."
            );
          }
          return;
        }

        if (!hasDestinationCoordinates) {
          if (isMounted) {
            setLocationMessage(
              "Destination coordinates are missing. Please select your destination again."
            );
          }
          return;
        }

        const firstPosition = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!isMounted) return;

        setCurrentLocation({
          latitude: firstPosition.coords.latitude,
          longitude: firstPosition.coords.longitude,
        });
        setLocationMessage("Tracking your location");

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (position) => {
            if (!isMounted) return;

            setCurrentLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            setLocationMessage("Tracking your location");
          }
        );
      } catch (error) {
        console.error("Location tracking error:", error);

        if (isMounted) {
          setLocationMessage(
            "Unable to get your location. Check your GPS and try again."
          );
        }
      }
    }

    startTracking();

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, [hasDestinationCoordinates]);

  useEffect(() => {
    if (!currentLocation || !hasDestinationCoordinates) {
      setDistanceKm(null);
      return;
    }

    const distance = calculateDistanceKm(currentLocation, {
      latitude: destinationLatitude,
      longitude: destinationLongitude,
    });

    setDistanceKm(distance);
  }, [
    currentLocation,
    hasDestinationCoordinates,
    destinationLatitude,
    destinationLongitude,
  ]);

  // Rough estimate only; actual road travel time can be longer.
  const estimatedMinutes =
    distanceKm === null ? null : Math.round((distanceKm / 25) * 60);

  function endJourney() {
    Alert.alert("End journey?", "Do you want to end this journey?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End Journey",
        style: "destructive",
        onPress: () => router.replace("/"),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
          style={styles.backButton}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Active Journey</Text>
        <View style={{ width: 55 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.statusRow}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>
            {isTracking ? "Journey in progress" : "Tracking paused"}
          </Text>
        </View>

        <Text style={styles.label}>YOUR DESTINATION</Text>
        <Text style={styles.destination}>{displayName}</Text>

        {hasDestinationCoordinates ? (
          <View style={styles.mapContainer}>
            <TravelMap
              latitude={destinationLatitude}
              longitude={destinationLongitude}
              title={displayName}
            />
          </View>
        ) : (
          <Text style={styles.warning}>
            Destination coordinates are unavailable. Go back and select the
            destination again.
          </Text>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>DISTANCE LEFT</Text>
            <Text style={styles.statValue}>
              {distanceKm === null
                ? "--"
                : distanceKm < 1
                  ? `${Math.round(distanceKm * 1000)} m`
                  : `${distanceKm.toFixed(2)} km`}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>ROUGH ETA</Text>
            <Text style={styles.statValue}>
              {estimatedMinutes === null
                ? "--"
                : estimatedMinutes < 1
                  ? "< 1 min"
                  : `${estimatedMinutes} min`}
            </Text>
          </View>
        </View>

        <View style={styles.locationCard}>
          {distanceKm === null && (
            <ActivityIndicator size="small" color="#2563eb" />
          )}
          <Text style={styles.locationText}>{locationMessage}</Text>
          {currentLocation && (
            <Text style={styles.coordinates}>
              GPS: {currentLocation.latitude.toFixed(5)},{" "}
              {currentLocation.longitude.toFixed(5)}
            </Text>
          )}
        </View>

        <View style={styles.alarmCard}>
          <Text style={styles.alarmEmoji}>🔔</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.alarmTitle}>Travel alarm setting</Text>
            <Text style={styles.alarmDescription}>
              Selected alert: {alarmMinutes} minutes before arrival
            </Text>
            <Text style={styles.note}>
              This setting is displayed for now. The actual alarm notification
              has not been implemented yet.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => {
            setIsTracking(true);
            setLocationMessage("Refreshing your location...");
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
            })
              .then((position) => {
                setCurrentLocation({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                });
                setLocationMessage("Tracking your location");
              })
              .catch(() => {
                setLocationMessage(
                  "Unable to refresh location. Check your GPS."
                );
              });
          }}
        >
          <Text style={styles.refreshButtonText}>Refresh My Location</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.endButton}
          onPress={endJourney}
        >
          <Text style={styles.endButtonText}>End Journey</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  backButton: {
    width: 55,
  },
  backText: {
    fontSize: 16,
    color: "#2563eb",
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#0f172a",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  liveDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#16a34a",
    marginRight: 8,
  },
  liveText: {
    fontSize: 13,
    color: "#15803d",
    fontWeight: "600",
  },
  label: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "700",
    letterSpacing: 1,
  },
  destination: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 5,
    marginBottom: 16,
  },
  mapContainer: {
    overflow: "hidden",
    borderRadius: 16,
    marginBottom: 16,
  },
  warning: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#fef3c7",
    color: "#92400e",
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  statLabel: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  statValue: {
    color: "#0f172a",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 8,
  },
  locationCard: {
    backgroundColor: "#eff6ff",
    padding: 14,
    borderRadius: 12,
    marginTop: 14,
    alignItems: "center",
    gap: 6,
  },
  locationText: {
    color: "#1d4ed8",
    fontSize: 13,
    textAlign: "center",
  },
  coordinates: {
    color: "#475569",
    fontSize: 11,
  },
  alarmCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginTop: 16,
  },
  alarmEmoji: {
    fontSize: 24,
  },
  alarmTitle: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 15,
  },
  alarmDescription: {
    color: "#475569",
    fontSize: 13,
    marginTop: 5,
  },
  note: {
    color: "#b45309",
    fontSize: 11,
    marginTop: 8,
    lineHeight: 16,
  },
  refreshButton: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  refreshButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
  },
  endButton: {
    backgroundColor: "#fee2e2",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  endButtonText: {
    color: "#b91c1c",
    fontWeight: "700",
    fontSize: 15,
  },
});
