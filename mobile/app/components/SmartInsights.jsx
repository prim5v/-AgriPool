// app/components/SmartInsights.jsx
import React, { useContext } from "react";
import { View, Text, StyleSheet } from "react-native";
import { InfoContext } from "../../_Context/InfoContext";

const SmartInsights = () => {
  const { insights } = useContext(InfoContext);
  const items = insights.length ? insights : [
    { id: "1", title: "Tomato demand up 20%", body: "Next week demand in Nairobi expected to rise 20%" },
    { id: "2", title: "Transport pooling", body: "Pooling opportunity: 12 farmers in your area" }
  ];

  return (
    <View style={{ marginTop: 12, paddingHorizontal: 12 }}>
      <Text style={{ fontWeight: "800", color: "#1b5e20", marginBottom: 8 }}>Smart Insights</Text>
      {items.map(i => (
        <View key={i.id} style={styles.card}>
          <Text style={styles.title}>{i.title}</Text>
          <Text style={styles.body}>{i.body}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", padding: 12, borderRadius: 10, marginBottom: 10, elevation: 2 },
  title: { fontWeight: "800" },
  body: { color: "#555", marginTop: 6 },
});

export default SmartInsights;
