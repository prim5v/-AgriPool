// app/components/Marketplace.jsx
import React, { useContext } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { InfoContext } from "../../_Context/InfoContext";
import { useRouter } from "expo-router";

const Marketplace = () => {
  const { market } = useContext(InfoContext);
  const router = useRouter();

  const buyers = market?.buyers || [
    { id: "1", name: "Buyer A (Nairobi)", offer: "Maize KSh 46/kg" },
    { id: "2", name: "Buyer B (Kisumu)", offer: "Potatoes KSh 28/kg" },
  ];

  return (
    <View style={{ marginTop: 12 }}>
      <Text style={{ fontWeight: "800", color: "#1b5e20", marginLeft: 12 }}>
        🛒 Marketplace Snapshot
      </Text>

      <FlatList
        horizontal
        data={[...buyers, { id: "post", post: true }]}
        keyExtractor={(i) => i.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
        renderItem={({ item }) =>
          item.post ? (
            <TouchableOpacity
              style={[styles.card, styles.postCard]}
              onPress={() => router.push("/screens/upload")}
            >
              <Text style={{ fontWeight: "800", color: "#1b5e20" }}>
                + Post New Produce
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.card}>
              <Text style={{ fontWeight: "800" }}>{item.name}</Text>
              <Text style={{ color: "#666", marginTop: 6 }}>{item.offer}</Text>
            </View>
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 220,
    height: 100,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    elevation: 2,
  },
  postCard: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
  },
});

export default Marketplace;
