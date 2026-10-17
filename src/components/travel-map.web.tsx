import { View, Text } from "react-native";

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
    <View
      style={{
        height: 280,
        width: "100%",
        backgroundColor: "#191C25",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "white", fontSize: 18 }}>
        {title}
      </Text>
      <Text style={{ color: "#9CA3AF" }}>
        {latitude.toFixed(5)}, {longitude.toFixed(5)}
      </Text>
    </View>
  );
}