// app/Farmer/(tabs)/components/WeatherInfo.jsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { MotiView } from "moti";
import useLocation from "../../hooks/useLocation";

export default function WeatherInfo() {
  const { location, errorMsg } = useLocation();
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    if (location) fetchWeather(location.latitude, location.longitude);
  }, [location]);

  const fetchWeather = async (lat, lon) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=Africa/Nairobi`;
      const res = await fetch(url);
      const data = await res.json();
      setWeather(data);
    } catch (err) {
      console.error("Weather fetch error:", err);
    }
  };

  if (errorMsg)
    return <Text style={styles.error}>Location error: {errorMsg}</Text>;

  if (!location || !weather)
    return <ActivityIndicator size="large" color="#2d6a4f" style={{ marginTop: 20 }} />;

  const WeatherAnimation = () => {
    const code = weather.current_weather.weathercode;
    if (code <= 2)
      return (
        <MotiView
          from={{ rotate: "0deg", opacity: 0.6 }}
          animate={{ rotate: "360deg", opacity: 1 }}
          transition={{ loop: true, duration: 8000 }}
          style={styles.sun}
        />
      );
    else if (code <= 61)
      return (
        <View style={styles.rainContainer}>
          {[...Array(8)].map((_, i) => (
            <MotiView
              key={i}
              from={{ translateY: 0, opacity: 0 }}
              animate={{ translateY: 60, opacity: 1 }}
              transition={{
                loop: true,
                duration: 800 + i * 100,
                delay: i * 150,
              }}
              style={styles.raindrop}
            />
          ))}
        </View>
      );
    else
      return (
        <MotiView
          from={{ translateX: -10 }}
          animate={{ translateX: 10 }}
          transition={{ loop: true, duration: 1000 }}
          style={styles.wind}
        />
      );
  };

  return (
    <View style={styles.card}>
      <WeatherAnimation />
      <Text style={styles.title}>Current Weather</Text>
      <Text style={styles.text}>
        🌡️ Temp: {weather.current_weather.temperature}°C
      </Text>
      <Text style={styles.text}>
        💨 Wind: {weather.current_weather.windspeed} km/h
      </Text>
      <Text style={styles.text}>
        🌦️ Rainfall Pattern: Moderate chance of showers today
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#e8f5e9",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginTop: 16,
    elevation: 3,
  },
  sun: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ffb703",
    marginBottom: 10,
  },
  rainContainer: {
    flexDirection: "row",
    height: 60,
    marginBottom: 10,
  },
  raindrop: {
    width: 4,
    height: 15,
    backgroundColor: "#0077b6",
    borderRadius: 2,
    marginHorizontal: 3,
  },
  wind: {
    width: 100,
    height: 6,
    backgroundColor: "#a2d2ff",
    borderRadius: 3,
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2d6a4f",
  },
  text: {
    fontSize: 16,
    color: "#333",
  },
  error: {
    color: "red",
    textAlign: "center",
  },
});
