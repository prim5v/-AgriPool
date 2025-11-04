import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Ratings() {
  const mockRatings = [
    { id: 1, buyer: "John Doe", rating: 5, comment: "Excellent produce quality!" },
    { id: 2, buyer: "Jane Smith", rating: 4, comment: "Fast delivery and fresh." },
    { id: 3, buyer: "Peter Mwangi", rating: 3, comment: "Average experience." },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ratings & Feedback</Text>
      <FlatList
        data={mockRatings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.buyer}>{item.buyer}</Text>
            <View style={styles.stars}>
              {[...Array(item.rating)].map((_, i) => (
                <Ionicons key={i} name="star" size={16} color="#ffb703" />
              ))}
            </View>
            <Text style={styles.comment}>{item.comment}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 15, backgroundColor: "#fff", padding: 15, borderRadius: 10 },
  title: { fontWeight: "bold", fontSize: 18, marginBottom: 10 },
  item: {
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingVertical: 10,
  },
  buyer: { fontWeight: "600", color: "#333" },
  stars: { flexDirection: "row", marginVertical: 4 },
  comment: { color: "#555" },
});
