import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TravelMap from "../components/travel-map.native";

type DestinationResult = {
  place_id: number | string;
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
  const dark = useColorScheme() === "dark";
  const c = dark
    ? {
        bg: "#101318",
        surface: "#191e27",
        raised: "#222936",
        text: "#f8fafc",
        muted: "#a0a9b8",
        border: "#303948",
        primary: "#6ea8fe",
        onPrimary: "#07172f",
        selected: "#19365b",
        danger: "#ffb4ab",
        dangerBg: "#402523",
      }
    : {
        bg: "#f5f7fb",
        surface: "#ffffff",
        raised: "#f0f4fa",
        text: "#172033",
        muted: "#687386",
        border: "#e1e7f0",
        primary: "#2563eb",
        onPrimary: "#ffffff",
        selected: "#e8f1ff",
        danger: "#b42318",
        dangerBg: "#fff0ee",
      };
  const s = makeStyles(c);
  const params = useLocalSearchParams<{ destination?: string | string[] }>();
  const initial = Array.isArray(params.destination)
    ? (params.destination[0] ?? "")
    : (params.destination ?? "");
  const [destination, setDestination] = useState(initial);
  const [results, setResults] = useState<DestinationResult[]>([]);
  const [selected, setSelected] = useState<SelectedDestination | null>(null);
  const [mapWasTapped, setMapWasTapped] = useState(false);
  const [minutes, setMinutes] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setDestination(initial), [initial]);

  async function findDestination() {
    const query = destination.trim();
    if (!query) {
      setError("Enter a destination to search.");
      return;
    }
    setLoading(true);
    setError("");
    setResults([]);
    setSelected(null);
    setMapWasTapped(false);
    try {
      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=10&lang=en`,
      );
      if (!response.ok)
        throw new Error(`Search failed: HTTP ${response.status}`);
      const data = await response.json();
      const found: DestinationResult[] = (data.features ?? [])
        .filter((item: any) => item.properties?.countrycode === "IN")
        .map((item: any) => ({
          place_id:
            item.properties.osm_id ??
            `${item.properties.name}-${item.geometry.coordinates.join(",")}`,
          display_name: [
            item.properties.name,
            item.properties.state,
            item.properties.country,
          ]
            .filter(Boolean)
            .join(", "),
          lat: String(item.geometry.coordinates[1]),
          lon: String(item.geometry.coordinates[0]),
        }));
      if (!found.length)
        setError(
          "No matching place found in India. Try a more specific search.",
        );
      else setResults(found);
    } catch (e) {
      console.error("Destination search error:", e);
      setError(
        "Could not search right now. Check your internet connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function chooseResult(item: DestinationResult) {
    const latitude = Number(item.lat),
      longitude = Number(item.lon);
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      Math.abs(latitude) > 90 ||
      Math.abs(longitude) > 180
    ) {
      setError("This result has invalid coordinates. Choose another place.");
      return;
    }
    setSelected({ latitude, longitude, displayName: item.display_name });
    setDestination(item.display_name);
    setResults([]);
    setMapWasTapped(false);
    setError("");
  }

  function chooseMapPoint(latitude: number, longitude: number) {
    setSelected((previous) => ({
      latitude,
      longitude,
      displayName:
        previous?.displayName ?? (destination.trim() || "Pinned destination"),
    }));
    setMapWasTapped(true);
    setError("");
  }

  function startJourney() {
    if (!selected) {
      setError("Search for a destination and select a result first.");
      return;
    }
    router.push({
      pathname: "/active-journey",
      params: {
        destination,
        displayName: selected.displayName,
        latitude: String(selected.latitude),
        longitude: String(selected.longitude),
        minutes: String(minutes),
      },
    });
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView
        style={s.page}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={s.back}
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
        >
          <Text style={s.backText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={s.headingRow}>
          <View style={s.headingIcon}>
            <Text style={s.headingIconText}>↗</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.eyebrow}>GEOALARM · PLAN</Text>
            <Text style={s.heading}>Plan your journey</Text>
          </View>
        </View>
        <Text style={s.subtitle}>
          Choose your destination and when you want to be alerted.
        </Text>

        <View style={s.card}>
          <Text style={s.label}>DESTINATION</Text>
          <TextInput
            style={s.input}
            value={destination}
            onChangeText={(v) => {
              setDestination(v);
              setSelected(null);
              setMapWasTapped(false);
              setResults([]);
              setError("");
            }}
            placeholder="City, station or landmark"
            placeholderTextColor={c.muted}
            returnKeyType="search"
            onSubmitEditing={findDestination}
            autoCorrect={false}
          />

          <TouchableOpacity
            style={s.primaryButton}
            onPress={findDestination}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={c.onPrimary} />
            ) : (
              <Text style={s.primaryText}>Search destination</Text>
            )}
          </TouchableOpacity>
          {!!error && (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}
          {results.length > 0 && (
            <View style={s.results}>
              <Text style={s.resultsTitle}>Choose the right place</Text>
              {results.map((item, i) => (
                <TouchableOpacity
                  key={`${item.place_id}-${i}`}
                  style={s.result}
                  onPress={() => chooseResult(item)}
                >
                  <View style={s.pinBadge}>
                    <Text style={s.pinText}>●</Text>
                  </View>
                  <Text style={s.resultText}>{item.display_name}</Text>
                  <Text style={s.chevron}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {selected && (
          <>
            <View style={s.sectionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.sectionTitle}>Confirm on map</Text>
                <Text style={s.sectionHint}>
                  Tap the map or drag the pin to fine-tune.
                </Text>
              </View>
              <View style={s.pill}>
                <View style={s.liveDot} />
                <Text style={s.pillText}>Interactive</Text>
              </View>
            </View>
            <View style={s.mapCard}>
              <TravelMap
                latitude={selected.latitude}
                longitude={selected.longitude}
                title={selected.displayName}
                onLocationSelect={chooseMapPoint}
              />
              <View style={s.coordRow}>
                <View style={s.pinBadge}>
                  <Text style={s.coordGlyph}>⌖</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.coordTitle}>
                    {mapWasTapped ? "Pinned location" : "Selected location"}
                  </Text>
                  <Text style={s.coords}>
                    {selected.latitude.toFixed(6)},{" "}
                    {selected.longitude.toFixed(6)}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={s.sectionTitle}>Alert before arrival</Text>
            <Text style={s.sectionHint}>
              Choose how early you want to be notified.
            </Text>
            <View style={s.alarmRow}>
              {ALARM_OPTIONS.map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setMinutes(m)}
                  style={[s.alarm, minutes === m && s.alarmSelected]}
                >
                  <Text
                    style={[
                      s.alarmNumber,
                      minutes === m && s.alarmTextSelected,
                    ]}
                  >
                    {m}
                  </Text>
                  <Text
                    style={[s.alarmUnit, minutes === m && s.alarmTextSelected]}
                  >
                    min before
                  </Text>
                  {minutes === m && (
                    <View style={s.check}>
                      <Text style={s.checkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={s.primaryLarge}
              onPress={startJourney}
              activeOpacity={0.85}
            >
              <Text style={s.primaryText}>Start travel journey</Text>
              <Text style={s.arrow}>→</Text>
            </TouchableOpacity>
            <Text style={s.disclaimer}>
              Location permission is required. Arrival time is an estimate.
            </Text>
          </>
        )}
        <Text style={s.footer}>
          Place search by Photon · Map data © OpenStreetMap contributors
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: Record<string, string>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    page: { flex: 1, backgroundColor: c.bg },
    content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 44 },
    back: { alignSelf: "flex-start", paddingVertical: 8, marginBottom: 16 },
    backText: { color: c.primary, fontSize: 15, fontWeight: "700" },
    headingRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    headingIcon: {
      width: 46,
      height: 46,
      borderRadius: 15,
      backgroundColor: c.selected,
      alignItems: "center",
      justifyContent: "center",
    },
    headingIconText: { fontSize: 27, color: c.primary, fontWeight: "700" },
    eyebrow: {
      color: c.primary,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.4,
      marginBottom: 3,
    },
    heading: {
      color: c.text,
      fontSize: 27,
      fontWeight: "800",
      letterSpacing: -0.6,
    },
    subtitle: {
      color: c.muted,
      fontSize: 14,
      lineHeight: 21,
      marginTop: 10,
      marginBottom: 22,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
    },
    label: {
      color: c.muted,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1.1,
      marginBottom: 10,
    },
    input: {
      backgroundColor: c.raised,
      color: c.text,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 14,
      height: 52,
      fontSize: 14,
    },
    primaryButton: {
      height: 50,
      borderRadius: 14,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 12,
      flexDirection: "row",
    },
    primaryText: { color: c.onPrimary, fontSize: 15, fontWeight: "800" },
    errorBox: {
      marginTop: 12,
      padding: 12,
      borderRadius: 12,
      backgroundColor: c.dangerBg,
    },
    errorText: { color: c.danger, fontSize: 13, lineHeight: 18 },
    results: { marginTop: 18 },
    resultsTitle: {
      color: c.text,
      fontSize: 14,
      fontWeight: "800",
      marginBottom: 6,
    },
    result: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      gap: 10,
    },
    pinBadge: {
      width: 30,
      height: 30,
      borderRadius: 10,
      backgroundColor: c.selected,
      alignItems: "center",
      justifyContent: "center",
    },
    pinText: { color: c.primary, fontSize: 12 },
    resultText: { color: c.text, fontSize: 13, lineHeight: 19, flex: 1 },
    chevron: { color: c.muted, fontSize: 24 },
    sectionHeader: {
      marginTop: 26,
      marginBottom: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    sectionTitle: {
      color: c.text,
      fontSize: 18,
      fontWeight: "800",
      marginTop: 22,
      marginBottom: 5,
    },
    sectionHint: {
      color: c.muted,
      fontSize: 12,
      lineHeight: 18,
      marginBottom: 12,
    },
    pill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: c.selected,
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#22c55e",
    },
    pillText: { color: c.primary, fontSize: 11, fontWeight: "700" },
    mapCard: {
      backgroundColor: c.surface,
      borderRadius: 22,
      padding: 6,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: c.border,
    },
    coordRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 10,
      paddingVertical: 12,
    },
    coordGlyph: { color: c.primary, fontSize: 22 },
    coordTitle: {
      color: c.text,
      fontSize: 12,
      fontWeight: "800",
      marginBottom: 3,
    },
    coords: { color: c.muted, fontSize: 11, fontVariant: ["tabular-nums"] },
    alarmRow: { flexDirection: "row", gap: 8, marginTop: 2 },
    alarm: {
      flex: 1,
      minHeight: 78,
      borderRadius: 15,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      position: "relative",
    },
    alarmSelected: {
      backgroundColor: c.selected,
      borderColor: c.primary,
      borderWidth: 1.5,
    },
    alarmNumber: { color: c.text, fontSize: 20, fontWeight: "800" },
    alarmUnit: { color: c.muted, fontSize: 9, marginTop: 3, fontWeight: "600" },
    alarmTextSelected: { color: c.primary },
    check: {
      position: "absolute",
      right: 5,
      top: 5,
      width: 15,
      height: 15,
      borderRadius: 8,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    checkText: { color: c.onPrimary, fontSize: 9, fontWeight: "900" },
    primaryLarge: {
      height: 56,
      borderRadius: 17,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 24,
      flexDirection: "row",
      gap: 12,
    },
    arrow: { color: c.onPrimary, fontSize: 20, fontWeight: "800" },
    disclaimer: {
      color: c.muted,
      fontSize: 11,
      textAlign: "center",
      lineHeight: 17,
      marginTop: 12,
    },
    footer: {
      color: c.muted,
      fontSize: 10,
      textAlign: "center",
      lineHeight: 15,
      marginTop: 32,
    },
  });
}
