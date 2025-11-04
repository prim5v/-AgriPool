import React from "react";
import { View, Text, StyleSheet } from "react-native";
import OrderOverview from "../../components/OrderOverview"; // adjust path if needed

const Activity = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Orders</Text>
      <OrderOverview />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 10 },
  header: { fontSize: 22, fontWeight: "800", color: "#1b5e20", marginBottom: 10, paddingHorizontal: 12 },
});

export default Activity;
