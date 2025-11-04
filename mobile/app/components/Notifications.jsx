// app/components/Notifications.jsx
import React, { useContext } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { InfoContext } from "../../_Context/InfoContext";

const Notifications = () => {
  const { notifications } = useContext(InfoContext);

  return (
    <View style={{ marginTop: 12, paddingHorizontal: 12 }}>
      <Text style={{ fontWeight: "800", color: "#1b5e20", marginBottom: 8 }}>🔔 Notifications</Text>
      <FlatList
        data={notifications}
        keyExtractor={(i, idx) => i.id?.toString() || String(idx)}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.text}>{item.message}</Text>
            <Text style={styles.time}>{item.time || ""}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: "#666" }}>No recent alerts</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginRight: 10,
    minWidth: 220,
    elevation: 1,
  },
  text: { fontWeight: "700" },
  time: { fontSize: 12, color: "#777", marginTop: 4 },
});

export default Notifications;
