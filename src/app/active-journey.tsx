
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet, Text,
  TouchableOpacity, useColorScheme, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TravelMap from "../components/travel-map.native";

type GPSPoint = { latitude: number; longitude: number };
function getParam(v: string | string[] | undefined): string { return Array.isArray(v) ? v[0] ?? "" : v ?? ""; }
function calculateDistanceKm(from: GPSPoint, to: GPSPoint): number {
  const rad = (d: number) => d * Math.PI / 180, r = 6371;
  const dLat = rad(to.latitude - from.latitude), dLon = rad(to.longitude - from.longitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(from.latitude)) * Math.cos(rad(to.latitude)) * Math.sin(dLon / 2) ** 2;
  const safeA = Math.min(1, Math.max(0, a));
  return r * 2 * Math.atan2(Math.sqrt(safeA), Math.sqrt(1 - safeA));
}

export default function ActiveJourneyScreen() {
  const router = useRouter();
  const dark = useColorScheme() === "dark";
  const c = dark
    ? { bg: "#101318", surface: "#191e27", raised: "#222936", text: "#f8fafc", muted: "#a0a9b8", border: "#303948", primary: "#6ea8fe", selected: "#19365b", danger: "#ffb4ab", dangerBg: "#402523" }
    : { bg: "#f5f7fb", surface: "#ffffff", raised: "#f0f4fa", text: "#172033", muted: "#687386", border: "#e1e7f0", primary: "#2563eb", selected: "#e8f1ff", danger: "#b42318", dangerBg: "#fff0ee" };
  const s = makeStyles(c);
  const p = useLocalSearchParams<{ destination?: string | string[]; minutes?: string | string[]; latitude?: string | string[]; longitude?: string | string[]; displayName?: string | string[] }>();
  const destination = getParam(p.destination) || "Your destination";
  const displayName = getParam(p.displayName) || destination;
  const alarmMinutes = Math.max(0, Number(getParam(p.minutes)) || 10);
  const lat = Number(getParam(p.latitude)), lon = Number(getParam(p.longitude));
  const hasCoords = getParam(p.latitude) !== "" && getParam(p.longitude) !== "" && Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
  const [current, setCurrent] = useState<GPSPoint | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [message, setMessage] = useState("Getting your current location...");
  const [tracking, setTracking] = useState(true);

  useEffect(() => {
    let mounted = true;
    let sub: Location.LocationSubscription | null = null;
    async function track() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted) { if (mounted) setMessage("Allow location access to track your journey."); return; }
        if (!hasCoords) { if (mounted) setMessage("Destination coordinates are missing. Select your destination again."); return; }
        const first = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!mounted) return;
        setCurrent({ latitude: first.coords.latitude, longitude: first.coords.longitude });
        setMessage("Your location is updating");
        sub = await Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 10 }, pos => {
          if (!mounted) return;
          setCurrent({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          setMessage("Your location is updating");
        });
      } catch (e) {
        console.error("Location tracking error:", e);
        if (mounted) setMessage("Couldn't get your location. Check GPS and try again.");
      }
    }
    track();
    return () => { mounted = false; sub?.remove(); };
  }, [hasCoords]);

  useEffect(() => {
    if (!current || !hasCoords) { setDistance(null); return; }
    setDistance(calculateDistanceKm(current, { latitude: lat, longitude: lon }));
  }, [current, hasCoords, lat, lon]);

  const eta = distance === null ? null : Math.round(distance / 25 * 60);
  function endJourney() {
    Alert.alert("End journey?", "Do you want to end this journey?", [
      { text: "Keep journey", style: "cancel" },
      { text: "End journey", style: "destructive", onPress: () => router.replace("/") },
    ]);
  }
   async function refresh() {
    setTracking(true); setMessage("Refreshing your location...");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) { setMessage("Allow location access to refresh GPS."); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCurrent({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      setMessage("Your location is updating");
    } catch { setMessage("Unable to refresh location. Check GPS."); }
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView style={s.page} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <TouchableOpacity style={s.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/")}><Text style={s.backText}>‹  Back</Text></TouchableOpacity>
          <Text style={s.headerTitle}>Your journey</Text><View style={{ width: 54 }} />
        </View>
        <View style={s.statusPill}><View style={[s.dot, !tracking && s.pausedDot]} /><Text style={s.statusText}>{tracking ? "Journey in progress" : "Tracking paused"}</Text></View>
        <Text style={s.eyebrow}>DESTINATION</Text>
        <Text style={s.destination}>{displayName}</Text>
        <Text style={s.helper}>Keep this screen open for live location updates.</Text>

        {hasCoords ? <View style={s.mapCard}>
          <TravelMap latitude={lat} longitude={lon} title={displayName} />
          <Text style={s.mapCaption}>Map data © OpenStreetMap contributors</Text>
        </View> : <Text style={s.warning}>Destination coordinates are unavailable. Go back and select your destination again.</Text>}

        <View style={s.stats}>
          <View style={s.statCard}><Text style={s.statLabel}>DISTANCE LEFT</Text><Text style={s.statValue}>{distance === null ? "—" : distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(2)} km`}</Text><Text style={s.statHint}>Straight-line distance</Text></View>
          <View style={s.statCard}><Text style={s.statLabel}>ROUGH ETA</Text><Text style={s.statValue}>{eta === null ? "—" : eta < 1 ? "< 1 min" : `${eta} min`}</Text><Text style={s.statHint}>Approximate only</Text></View>
        </View>

        <View style={s.card}>
          <View style={s.cardHeader}>
            {distance === null ? <ActivityIndicator size="small" color={c.primary} /> : <View style={s.gpsIcon}><Text style={s.gpsGlyph}>⌖</Text></View>}
            <View style={{ flex: 1 }}><Text style={s.cardTitle}>Live location</Text><Text style={s.bodyText}>{message}</Text></View>
          </View>
          {current && <Text style={s.coordinates}>GPS  {current.latitude.toFixed(5)}, {current.longitude.toFixed(5)}</Text>}
          <TouchableOpacity style={s.secondaryButton} onPress={refresh}><Text style={s.secondaryText}>Refresh location</Text></TouchableOpacity>
        </View>

        <View style={s.card}>
          <View style={s.cardHeader}><View style={s.gpsIcon}><Text style={s.bell}>♧</Text></View><View style={{ flex: 1 }}><Text style={s.cardTitle}>Arrival alert</Text><Text style={s.bodyText}>Selected: {alarmMinutes} minutes before arrival</Text></View></View>
          <View style={s.notice}><Text style={s.noticeText}>Notifications are not implemented yet. This is a display setting, not an active alarm.</Text></View>
        </View>

        <TouchableOpacity style={s.endButton} onPress={endJourney} activeOpacity={0.85}><Text style={s.endText}>End journey</Text></TouchableOpacity>
        <Text style={s.footer}>GeoAlarm · Travel with peace of mind</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: Record<string, string>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg }, page: { flex: 1, backgroundColor: c.bg },
    content: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 40 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 22 },
    back: { width: 64, paddingVertical: 8 }, backText: { color: c.primary, fontSize: 14, fontWeight: "700" }, headerTitle: { color: c.text, fontSize: 18, fontWeight: "800" },
    statusPill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 20, backgroundColor: c.selected, paddingHorizontal: 11, paddingVertical: 8, marginBottom: 20 },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#22c55e" }, pausedDot: { backgroundColor: "#f59e0b" }, statusText: { color: c.primary, fontSize: 11, fontWeight: "800" },
    eyebrow: { color: c.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1.2 }, destination: { color: c.text, fontSize: 24, lineHeight: 31, fontWeight: "800", marginTop: 5 },
    helper: { color: c.muted, fontSize: 12, lineHeight: 18, marginTop: 6, marginBottom: 16 },
    mapCard: { borderRadius: 22, overflow: "hidden", backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, padding: 6, marginBottom: 14 }, mapCaption: { color: c.muted, fontSize: 10, paddingHorizontal: 8, paddingTop: 8, paddingBottom: 4 },
    warning: { color: c.danger, backgroundColor: c.dangerBg, borderRadius: 14, padding: 14, marginBottom: 16, lineHeight: 20 },
    stats: { flexDirection: "row", gap: 10 }, statCard: { flex: 1, backgroundColor: c.surface, padding: 15, borderRadius: 18, borderWidth: 1, borderColor: c.border },
    statLabel: { color: c.muted, fontSize: 9, fontWeight: "800", letterSpacing: 0.6 }, statValue: { color: c.text, fontSize: 23, fontWeight: "800", marginTop: 9 }, statHint: { color: c.muted, fontSize: 10, marginTop: 5 },
    card: { backgroundColor: c.surface, borderRadius: 18, padding: 16, marginTop: 12, borderWidth: 1, borderColor: c.border }, cardHeader: { flexDirection: "row", alignItems: "center", gap: 11 },
    gpsIcon: { width: 35, height: 35, borderRadius: 12, backgroundColor: c.selected, alignItems: "center", justifyContent: "center" }, gpsGlyph: { color: c.primary, fontSize: 23 }, bell: { color: c.primary, fontSize: 23 },
    cardTitle: { color: c.text, fontSize: 13, fontWeight: "800", marginBottom: 3 }, bodyText: { color: c.muted, fontSize: 12, lineHeight: 18 },
    coordinates: { color: c.muted, fontSize: 10, marginTop: 13, fontVariant: ["tabular-nums"] },
    secondaryButton: { borderRadius: 12, backgroundColor: c.raised, alignItems: "center", paddingVertical: 12, marginTop: 13 }, secondaryText: { color: c.primary, fontSize: 13, fontWeight: "800" },
    notice: { backgroundColor: c.raised, borderRadius: 10, padding: 10, marginTop: 12 }, noticeText: { color: c.muted, fontSize: 10, lineHeight: 16 },
    endButton: { backgroundColor: c.dangerBg, borderRadius: 15, paddingVertical: 15, alignItems: "center", marginTop: 20 }, endText: { color: c.danger, fontSize: 14, fontWeight: "800" }, footer: { color: c.muted, fontSize: 10, textAlign: "center", marginTop: 22 },
  });
}