import React from "react";
import { View, Text, Platform, StyleSheet } from "react-native";

export default function HeaderInfo({ mode, vehiclePlate }) {
  return (
    <View style={styles.headerInfo}>
      <Text style={styles.headerText}>
        {mode === "picking" ? "Picking Route" : "Transit Route"}
      </Text>
      <Text style={styles.subText}>{vehiclePlate || ""}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerInfo: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    left: 16,
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    elevation: 3,
  },
  headerText: { fontWeight: "700", fontSize: 16 },
  subText: { fontSize: 12, color: "#555" },
});
