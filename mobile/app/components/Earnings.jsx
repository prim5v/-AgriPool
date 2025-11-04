import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import ApiSocket from "../ApiSocket";

export default function Earnings({ user }) {
  const [earnings, setEarnings] = useState([]);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const res = await ApiSocket.get(`/api/earnings/${user.id}`);
        if (Array.isArray(res.data?.earnings)) setEarnings(res.data.earnings);
      } catch (err) {
        console.log("Earnings fetch error:", err);
      }
    };
    fetchEarnings();
  }, []);

  const total = earnings.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Earnings Summary</Text>
      <Text style={styles.total}>Total: ₵ {total.toFixed(2)}</Text>

      {earnings.length > 0 ? (
        <FlatList
          data={earnings}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.amount}>₵ {item.amount}</Text>
              <Text style={styles.date}>{item.date}</Text>
            </View>
          )}
        />
      ) : (
        <Text style={styles.empty}>No transactions yet.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 10, backgroundColor: "#f8f9fa", padding: 15, borderRadius: 10 },
  title: { fontWeight: "bold", fontSize: 18, marginBottom: 5 },
  total: { fontWeight: "bold", fontSize: 16, color: "#2d6a4f", marginBottom: 10 },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  amount: { fontWeight: "bold" },
  date: { color: "#777" },
  empty: { textAlign: "center", color: "#999" },
});
