import React, { useRef } from "react";
import {
  Animated,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from "react-native";
import ApiSocket from "../ApiSocket";

const { width, height } = Dimensions.get("window");
const SHEET_HEIGHT = height * 0.25;

export default function BookingBottomSheet({
  mode,
  selectedBooking,
  onClose,
  onConfirm,
  service,
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [SHEET_HEIGHT, 0],
  });

  const handleConfirm = async (status) => {
    console.log("🧾 Confirming booking:", selectedBooking);
    if (!service || !selectedBooking) return;
    try {
      const payload = {
        service_id: service.service_id,
        status,
        ...(selectedBooking.farmers_user_id
          ? { farmers_user_id: selectedBooking.farmers_user_id }
          : { buyers_user_id: selectedBooking.buyers_user_id }),
      };
      const res = await ApiSocket.post(`/update-transport_booking-status`, payload);
      console.log("✅ Booking updated:", res.status);
      if (res.status === 200) onConfirm();
    } catch (e) {
      console.error("❌ handleConfirm error:", e.message);
    }
  };

  if (!selectedBooking) return null;

  return (
    <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
      <View style={styles.handle} />
      <ScrollView contentContainerStyle={{ padding: 12 }}>
        <Text style={styles.title}>Booking Details</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Farmer:</Text>
          <Text style={styles.value}>{selectedBooking.farmers_user_id || "-"}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Buyer:</Text>
          <Text style={styles.value}>{selectedBooking.buyers_user_id || "-"}</Text>
        </View>

        <TouchableOpacity
          style={styles.confirm}
          onPress={() =>
            handleConfirm(mode === "picking" ? "in_transit" : "completed")
          }
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>
            {mode === "picking" ? "Confirm Pick" : "Confirm Completed"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancel} onPress={onClose}>
          <Text style={{ color: "#333" }}>Close</Text>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: SHEET_HEIGHT,
    backgroundColor: "#fff",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    elevation: 10,
  },
  handle: {
    width: 60,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ddd",
    alignSelf: "center",
    marginTop: 8,
  },
  title: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", marginVertical: 4 },
  label: { color: "#555", fontWeight: "600" },
  value: { color: "#111", maxWidth: width * 0.6, textAlign: "right" },
  confirm: {
    backgroundColor: "#1b5e20",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  cancel: {
    backgroundColor: "#eee",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
});
