import { useMemo, useRef } from "react";
import { useColorScheme, View } from "react-native";
import { WebView } from "react-native-webview";

type Props = {
  latitude: number;
  longitude: number;
  title: string;
  onLocationSelect?: (latitude: number, longitude: number) => void;
};

export default function TravelMap({
  latitude,
  longitude,
  title,
  onLocationSelect,
}: Props) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const webViewRef = useRef<WebView>(null);

  const safeLatitude = Number.isFinite(latitude) ? latitude : 20.2961;

  const safeLongitude = Number.isFinite(longitude) ? longitude : 85.8245;

  const html = useMemo(
    () => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />

        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />

        <style>
          * {
            box-sizing: border-box;
          }

          html, body, #map {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: ${isDark ? "#171a21" : "#edf2f7"};
          }

          .leaflet-control-attribution {
            font-size: 9px !important;
          }

          .leaflet-control-zoom a {
            color: #2563eb !important;
          }

          .leaflet-popup-content-wrapper {
            border-radius: 12px;
          }

          .leaflet-marker-icon {
            touch-action: none;
          }
        </style>
      </head>

      <body>
        <div id="map"></div>

        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

        <script>
          const initialLat = ${safeLatitude};
          const initialLng = ${safeLongitude};
          const placeTitle = ${JSON.stringify(title)};

          const map = L.map("map", {
            zoomControl: false,
            attributionControl: true,
            dragging: true,
            touchZoom: true,
            scrollWheelZoom: true,
            doubleClickZoom: true,
            boxZoom: false,
            keyboard: true,
            tap: true,
            zoomAnimation: true,
            markerZoomAnimation: true
          }).setView(
            [initialLat, initialLng],
            14
          );

          L.control.zoom({
            position: "bottomright"
          }).addTo(map);

          L.tileLayer(
            "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
              maxZoom: 19,
              attribution: '&copy; OpenStreetMap contributors'
            }
          ).addTo(map);

          const marker = L.marker(
            [initialLat, initialLng],
            {
              draggable: true,
              autoPan: true,
              autoPanPadding: [50, 50],
              autoPanSpeed: 10,
              riseOnHover: true
            }
          ).addTo(map);

          let lastSent = "";

          function sendLocation(lat, lng) {
            marker.setLatLng([lat, lng]);

            const coordinates =
              lat.toFixed(6) + ", " + lng.toFixed(6);

            marker.bindPopup(
              "<b>Selected destination</b><br>" +
              coordinates
            );

            const key = lat.toFixed(6) + "," + lng.toFixed(6);

            if (key !== lastSent) {
              lastSent = key;

              window.ReactNativeWebView.postMessage(
                JSON.stringify({
                  latitude: lat,
                  longitude: lng
                })
              );
            }
          }

          marker.bindPopup(
            "<b>" +
            placeTitle.replace(/[<>&]/g, "") +
            "</b><br>Drag the pin or tap the map"
          );

          map.on("click", function(event) {
            sendLocation(
              event.latlng.lat,
              event.latlng.lng
            );
          });

          marker.on("dragend", function(event) {
            const point = event.target.getLatLng();

            sendLocation(
              point.lat,
              point.lng
            );
          });

          map.on("load", function() {
            map.invalidateSize();
          });

          window.addEventListener("resize", function() {
            map.invalidateSize();
          });

          setTimeout(function() {
            map.invalidateSize();
          }, 500);
        </script>
      </body>
    </html>
  `,
    [safeLatitude, safeLongitude, title, isDark],
  );

  return (
    <View
      style={{
        height: 300,
        overflow: "hidden",
        borderRadius: 20,
        backgroundColor: isDark ? "#171a21" : "#edf2f7",
      }}
    >
      <WebView
        ref={webViewRef}
        source={{ html }}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        nestedScrollEnabled
        bounces={false}
        overScrollMode="never"
        onMessage={(event) => {
          try {
            const point = JSON.parse(event.nativeEvent.data);

            if (
              Number.isFinite(point.latitude) &&
              Number.isFinite(point.longitude)
            ) {
              onLocationSelect?.(point.latitude, point.longitude);
            }
          } catch (error) {
            console.warn("Map selection error:", error);
          }
        }}
        style={{
          flex: 1,
          backgroundColor: isDark ? "#171a21" : "#edf2f7",
        }}
      />
    </View>
  );
}
