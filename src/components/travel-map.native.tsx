
import MapView, { Marker } from "react-native-maps";

type Props = {
  latitude: number;
  longitude: number;
  title: string;
};

export default function TravelMap({
  latitude,
  longitude,
  title,
}: Props) {
  return (
    <MapView
      style={{ width: "100%", height: 280, borderRadius: 16 }}
      initialRegion={{
        latitude,
        longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      }}
    >
      <Marker
        coordinate={{ latitude, longitude }}
        title={title}
      />
    </MapView>
  );
}
