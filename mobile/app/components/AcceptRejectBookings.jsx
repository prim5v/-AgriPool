import React, { useEffect, useState, useRef, useCallback, useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { AuthContext } from "../../_Context/Auth.Context";
import ApiSocket from "../ApiSocket";

const POLL_INTERVAL = 5000; // 5 seconds

const AcceptRejectBookings = () => {
  const { user } = useContext(AuthContext);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const intervalRef = useRef(null);

  // ✅ Stable fetch function (no infinite re-renders)
  const fetchBookings = useCallback(async () => {
    if (fetching || !user?.user_id) return;

    setFetching(true);
    try {
      const response = await ApiSocket.post("/accept_pending_bookings", {
        user_id: user.user_id,
      });

      if (response.status === 200 && response.data?.pending_bookings?.length > 0) {
        setCurrentBooking(response.data.pending_bookings[0]); // show first booking only
      } else {
        setCurrentBooking(null); // no bookings found
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setCurrentBooking(null); // silent fail
      } else {
        console.error("❌ Error fetching pending bookings:", error.message);
      }
    } finally {
      setFetching(false);
    }
  }, [user, fetching]);

  // ✅ Stable update booking function
  const updateBookingStatus = async (newStatus) => {
    if (!currentBooking) return;
    setLoading(true);

    try {
      const payload = {
        service_id: currentBooking.service_id,
        farmers_user_id: currentBooking.farmers_user_id,
        status: newStatus,
      };

      const res = await ApiSocket.post("/update-transport_booking-status", payload);

      if (res.status === 200) {
        console.log(`✅ Booking ${newStatus} successfully.`);
        setCurrentBooking(null);
      } else {
        console.warn("⚠️ Failed to update booking status:", res.data);
      }
    } catch (error) {
      console.error("❌ Error updating booking status:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Poll every 5 seconds — only after user is ready
  useEffect(() => {
    if (!user?.user_id) return;

    fetchBookings(); // initial fetch
    intervalRef.current = setInterval(fetchBookings, POLL_INTERVAL);

    return () => clearInterval(intervalRef.current);
  }, [user, fetchBookings]);

  if (!currentBooking) return null; // Silent render

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.header}>🚛 New Booking Request</Text>
        <Text style={styles.text}>Buyer: {currentBooking.buyers_user_id}</Text>
        <Text style={styles.text}>Farmer: {currentBooking.farmers_user_id}</Text>
        <Text style={styles.text}>Distance: {currentBooking.distance_km} km</Text>
        <Text style={styles.text}>Total Price: Ksh {currentBooking.total_price}</Text>

        {currentBooking.order_items?.length > 0 && (
          <View style={styles.orderList}>
            <Text style={styles.subheader}>Order Items:</Text>
            {currentBooking.order_items.map((item, idx) => (
              <Text key={idx} style={styles.itemText}>
                🧺 Product: {item.product_id} | Qty: {item.quantity} | Ksh {item.item_price}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.btn, styles.rejectBtn]}
            onPress={() => updateBookingStatus("rejected")}
            disabled={loading}
          >
            <Text style={styles.btnText}>Reject</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.acceptBtn]}
            onPress={() => updateBookingStatus("accepted")}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Accept</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default AcceptRejectBookings;

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    width: "85%",
    elevation: 5,
  },
  header: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  subheader: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 10,
  },
  text: {
    fontSize: 14,
    marginBottom: 4,
  },
  itemText: {
    fontSize: 13,
    color: "#333",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: "center",
  },
  acceptBtn: { backgroundColor: "#2ecc71" },
  rejectBtn: { backgroundColor: "#e74c3c" },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});
