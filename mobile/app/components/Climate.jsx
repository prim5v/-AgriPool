// app/components/Climate.jsx
import React, { useContext, useMemo } from "react";
import { View, Text, StyleSheet, Image, Dimensions, Animated } from "react-native";
import { InfoContext } from "../../_Context/InfoContext";
// Optional: use Lottie for weather animation
// import LottieView from "lottie-react-native";

const { width } = Dimensions.get("window");

const formatTemp = (t) => `${Math.round(t)}°C`;

const Climate = () => {
  const { weather } = useContext(InfoContext);

  // Fallback data if weather not available
  const data = weather || {
    location: "Unknown",
    temp: 17,
    high: 19,
    low: 13,
    humidity: 68,
    precipitation: 2, // mm
    pressure: 1012,
    wind_kph: 12,
    sunrise: "06:12",
    sunset: "18:10",
    condition: { main: "Sunny", code: 800 },
  };

  // Animated sun position: using percentages from sunrise->sunset.
  // For demo use static Animated.Value; in a real app compute based on current time.
  const sunAnim = useMemo(() => new Animated.Value(0), []);

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(sunAnim, { toValue: 1, duration: 8000, useNativeDriver: true }),
        Animated.timing(sunAnim, { toValue: 0, duration: 1, useNativeDriver: true }),
      ])
    ).start();
  }, [sunAnim]);

  const translateX = sunAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.5],
  });

  // Color coding for hi-low
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image source={require("../../assets/images/location.jpg")} style={styles.icon} />
            <Text style={styles.locationText}>{data.location}</Text>
          </View>
          <Text style={styles.tempMain}>{formatTemp(data.temp)}</Text>
          <View style={styles.hiLowRow}>
            <Text style={styles.hiLowText}>H: {formatTemp(data.high)}</Text>
            <Text style={[styles.hiLowText, { marginLeft: 12 }]}>L: {formatTemp(data.low)}</Text>
          </View>
        </View>

        <View style={{ width: 100, alignItems: "center" }}>
          {/* Replace with LottieView showing condition animation (sun, rain, cloud) */}
          {/* <LottieView source={getLottieForCondition(data.condition)} autoPlay loop style={{width: 90, height: 90}} /> */}
          <Image source={require("../../assets/images/sun.jpeg")} style={{ width: 72, height: 72 }} />
        </View>
      </View>

      <View style={styles.hr} />

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricVal}>{data.humidity}%</Text>
          <Text style={styles.metricLabel}>Humidity</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricVal}>{data.precipitation} mm</Text>
          <Text style={styles.metricLabel}>Precip.</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricVal}>{data.pressure} hPa</Text>
          <Text style={styles.metricLabel}>Pressure</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricVal}>{data.wind_kph} km/h</Text>
          <Text style={styles.metricLabel}>Wind</Text>
        </View>
      </View>

      <View style={{ marginTop: 12 }}>
        <Text style={styles.sunTimes}>{data.sunrise} • sunrise</Text>
        <View style={styles.sunTrack}>
          <Animated.View style={[styles.sunBall, { transform: [{ translateX }] }]} />
        </View>
        <Text style={[styles.sunTimes, { textAlign: "right" }]}>{data.sunset} • sunset</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 14,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    elevation: 2,
  },
  topRow: { flexDirection: "row", alignItems: "center" },
  icon: { width: 16, height: 16, marginRight: 6, tintColor: "#388e3c" },
  locationText: { fontSize: 14, color: "#2e7d32", fontWeight: "600" },
  tempMain: { fontSize: 36, fontWeight: "900", color: "#1b5e20", marginTop: 6 },
  hiLowRow: { flexDirection: "row", marginTop: 6 },
  hiLowText: { fontSize: 14, color: "#4b8f5a" },
  hr: { height: 1, backgroundColor: "#eee", marginVertical: 10 },
  metricsRow: { flexDirection: "row", justifyContent: "space-between" },
  metric: { alignItems: "center", flex: 1 },
  metricVal: { fontWeight: "700", fontSize: 14, color: "#000" },
  metricLabel: { fontSize: 12, color: "#666" },
  sunTimes: { fontSize: 12, color: "#777", marginBottom: 6 },
  sunTrack: {
    height: 20,
    backgroundColor: "#f6f6f6",
    borderRadius: 10,
    overflow: "hidden",
    justifyContent: "center",
  },
  sunBall: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#ffb74d",
  },
});

export default Climate;
