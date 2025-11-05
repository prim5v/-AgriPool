import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  Linking,
  Alert,
} from "react-native";
import ApiSocket from "../ApiSocket"; // adjust if needed

const { height } = Dimensions.get("window");
const MAX_HEIGHT = height * 0.5;
const MIN_HEIGHT = 70;

export default function CurtainOverlay({
  mode = null,
  booking = null,
  service_id = null,
  transporterUserId = null,
  onStatusUpdated = () => {},
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const animatedHeight = useRef(new Animated.Value(MIN_HEIGHT)).current;

  useEffect(() => {
    console.log("🧩 CurtainOverlay mounted. Mode:", mode, "Booking:", booking);
    if (booking) {
      Animated.spring(animatedHeight, {
        toValue: MAX_HEIGHT,
        useNativeDriver: false,
      }).start(() => setIsExpanded(true));
    }
  }, [booking]);

  // === Handle drag
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 10,
      onPanResponderMove: (_, g) => {
        const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, MAX_HEIGHT - g.dy));
        animatedHeight.setValue(newHeight);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 50) {
          Animated.spring(animatedHeight, {
            toValue: MIN_HEIGHT,
            useNativeDriver: false,
          }).start(() => setIsExpanded(false));
        } else {
          Animated.spring(animatedHeight, {
            toValue: MAX_HEIGHT,
            useNativeDriver: false,
          }).start(() => setIsExpanded(true));
        }
      },
    })
  ).current;

  // === Confirm Picked / Completed ===
  const handleConfirm = async () => {
    console.log("🚀 handleConfirm triggered");
    console.log("📦 Current mode:", mode);
    console.log("📦 Booking object:", booking);
    console.log("📦 Service ID:", service_id);

    if (!booking || !service_id || !mode) {
      Alert.alert("Error", "Missing data for status update.");
      console.log("❌ Aborted: Missing booking, mode, or service_id");
      return;
    }

    const newStatus = mode === "picking" ? "in_transit" : "completed";
    console.log("🎯 New status to send:", newStatus);

    const payload = {
      service_id,
      status: newStatus,
      farmers_user_id: booking.type === "farmer" ? booking.user_id : undefined,
      buyers_user_id: booking.type === "buyer" ? booking.user_id : undefined,
    };

    console.log("📤 Sending payload to backend:", JSON.stringify(payload, null, 2));

    try {
      setLoading(true);
      const res = await ApiSocket.post("/update-transport_booking-status", payload);
      console.log("📬 Backend response status:", res.status);
      console.log("📬 Backend response data:", res.data);

      if (res.status === 200) {
        console.log("✅ Booking updated successfully on backend");
        Alert.alert("✅ Success", `Booking marked as ${newStatus}.`);

        onStatusUpdated();
        Animated.spring(animatedHeight, {
          toValue: MIN_HEIGHT,
          useNativeDriver: false,
        }).start(() => setIsExpanded(false));
      } else {
        console.log("⚠️ Unexpected response:", res.data);
        Alert.alert("Error", res.data?.error || "Unexpected response from server.");
      }
    } catch (err) {
      console.log("❌ Request failed:", err);
      Alert.alert("Error", err.message || "Failed to update booking.");
    } finally {
      setLoading(false);
      console.log("🧹 Loading state cleared.");
    }
  };

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Animated.View
        style={[styles.sheet, { height: animatedHeight }]}
        {...panResponder.panHandlers}
        pointerEvents="auto"
      >
        <View style={styles.handle} />

        {booking ? (
          <>
            <Text style={styles.title}>
              {booking.type === "farmer" ? "Farmer Details" : "Buyer Details"}
            </Text>

            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>{booking.address || "N/A"}</Text>

            {booking.landmark ? (
              <>
                <Text style={styles.label}>Landmark:</Text>
                <Text style={styles.value}>{booking.landmark}</Text>
              </>
            ) : null}

            {booking.instructions ? (
              <>
                <Text style={styles.label}>Instructions:</Text>
                <Text style={styles.value}>{booking.instructions}</Text>
              </>
            ) : null}

            {booking.phone ? (
              <>
                <Text style={styles.label}>Phone:</Text>
                <Text
                  style={[styles.value, styles.link]}
                  onPress={() => Linking.openURL(`tel:${booking.phone}`)}
                >
                  {booking.phone}
                </Text>
              </>
            ) : null}

            <Text style={styles.label}>Mode:</Text>
            <Text style={[styles.value, { textTransform: "capitalize" }]}>
              {mode || "Unknown"}
            </Text>

            <Text style={styles.label}>Service ID:</Text>
            <Text style={styles.value}>{service_id || "N/A"}</Text>

            {(mode === "picking" || mode === "in_transit") && (
              <TouchableOpacity
                style={[styles.btn, loading && { opacity: 0.6 }]}
                onPress={handleConfirm}
                disabled={loading}
              >
                <Text style={styles.btnText}>
                  {mode === "picking" ? "Confirm Picked" : "Confirm Completed"}
                </Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            <Text style={styles.text}>
              No active picking or transit service found.
            </Text>
          </>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  sheet: {
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: "center",
    paddingTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
  },
  handle: {
    width: 60,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#ccc",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1b5e20",
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    alignSelf: "flex-start",
    marginLeft: 25,
  },
  value: {
    fontSize: 15,
    color: "#222",
    marginBottom: 8,
    alignSelf: "flex-start",
    marginLeft: 25,
  },
  link: {
    color: "#1b5e20",
    textDecorationLine: "underline",
  },
  text: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 15,
    paddingHorizontal: 16,
  },
  btn: {
    backgroundColor: "#1b5e20",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginBottom: 15,
    marginTop: 10,
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
