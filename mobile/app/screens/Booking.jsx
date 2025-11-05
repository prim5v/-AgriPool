import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";

const Booking = () => {
  const { booking } = useLocalSearchParams();
  const data = booking ? JSON.parse(booking) : {};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📦 Booking Details</Text>
      <Text style={styles.item}>Booking ID: {data.booking_id}</Text>
      <Text style={styles.item}>Service ID: {data.service_id}</Text>
      <Text style={styles.item}>Farmer ID: {data.farmers_user_id}</Text>
      <Text style={styles.item}>Buyer ID: {data.buyers_user_id}</Text>
      <Text style={styles.item}>Status: {data.status}</Text>
      <Text style={styles.item}>Distance: {data.distance_km} km</Text>
      <Text style={styles.item}>Total Price: Ksh {data.total_price}</Text>
    </ScrollView>
  );
};

export default Booking;

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12, color: "#2e7d32" },
  item: { fontSize: 16, marginBottom: 6, color: "#333" },
});
