// app/Farmer/(tabs)/components/CropAdvice.jsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function CropAdvice() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>🌱 Crop Advice</Text>
      <Text style={styles.text}>
        Current weather and soil suggest growing:
      </Text>
      <Text style={styles.cropList}>
        • Maize 🌽{"\n"}• Beans 🫘{"\n"}• Tomatoes 🍅
      </Text>
      <Text style={styles.text}>
        Avoid water-intensive crops like rice if rainfall remains low.
      </Text>
      <Text style={styles.tip}>
        💡 Tip: Consider crop rotation and mulching to retain soil moisture.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f1faee",
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
  cropList: {
    fontSize: 16,
    color: "#2d6a4f",
    marginVertical: 8,
  },
  tip: {
    marginTop: 8,
    color: "#555",
    fontStyle: "italic",
  },
});
