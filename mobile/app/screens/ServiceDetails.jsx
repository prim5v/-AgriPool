import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";

const ServiceDetails = () => {
  const { service } = useLocalSearchParams();
  const data = JSON.parse(service);

  const { service: s, bookings, farmers_info, buyers_info } = data;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Service Details</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Service ID:</Text>
        <Text style={styles.value}>{s.service_id}</Text>
        <Text style={styles.label}>Status:</Text>
        <Text style={styles.value}>{s.status}</Text>
        <Text style={styles.label}>Vehicle:</Text>
        <Text style={styles.value}>{s.vehicle_plate || "N/A"}</Text>
        <Text style={styles.label}>Capacity:</Text>
        <Text style={styles.value}>{s.capacity || "N/A"}</Text>
      </View>

      <Text style={styles.subTitle}>Bookings</Text>
      {bookings.length === 0 ? (
        <Text>No bookings found</Text>
      ) : (
        bookings.map((b) => (
          <View key={b.booking_id} style={styles.bookingCard}>
            <Text>Booking ID: {b.booking_id}</Text>
            <Text>Farmer ID: {b.farmers_user_id}</Text>
            <Text>Buyer ID: {b.buyers_user_id}</Text>
            <Text>Status: {b.status}</Text>
          </View>
        ))
      )}

      <Text style={styles.subTitle}>Farmers Info</Text>
      {farmers_info.map((f) => (
        <Text key={f.user_id}>{f.name || f.email}</Text>
      ))}

      <Text style={styles.subTitle}>Buyers Info</Text>
      {buyers_info.map((b) => (
        <Text key={b.user_id}>{b.name || b.email}</Text>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "700", color: "#1b5e20", marginBottom: 10 },
  section: { marginBottom: 12 },
  label: { fontWeight: "700", color: "#333" },
  value: { marginBottom: 6, color: "#555" },
  subTitle: { fontSize: 18, fontWeight: "700", marginTop: 12, marginBottom: 4 },
  bookingCard: {
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    padding: 10,
    marginVertical: 4,
  },
});

export default ServiceDetails;
