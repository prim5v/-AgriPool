// app/Farmer/(tabs)/components/SoilData.jsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function SoilData() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Soil Data</Text>
      <Text style={styles.text}>🌾 Soil Type: Loamy</Text>
      <Text style={styles.text}>💧 Moisture Level: Moderate</Text>
      <Text style={styles.text}>⚗️ pH Level: 6.5 (Neutral)</Text>
      <Text style={styles.text}>🌍 Organic Matter: Good</Text>
      <Text style={styles.text}>🚜 Fertility: Suitable for most crops</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d6a4f",
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    color: "#333",
  },
});
