import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
  ScrollView,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import ApiSocket from "../ApiSocket";

const OrderPayment = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  console.log("💡 Raw incoming params:", params);

  // ---------------- FIXED PARSING ----------------
  const product_id = params.product_id ? params.product_id.split(",") : [];
  const quantity = params.quantity
    ? params.quantity.split(",").map((q) => {
        const n = Number(q);
        if (isNaN(n)) console.warn("⚠️ Invalid quantity:", q);
        return n;
      })
    : [];
  const unit_price = params.unit_price
    ? params.unit_price.split(",").map((p) => {
        const n = Number(p);
        if (isNaN(n)) console.warn("⚠️ Invalid unit price:", p);
        return n;
      })
    : [];
  const product_name = params.product_name ? params.product_name.split(",") : [];
  const total_price = Number(params.total_price) || 0;
  const user_id = String(params.user_id || "");

  console.log("✅ Parsed params:", {
    product_id,
    quantity,
    total_price,
    product_name,
    unit_price,
    user_id,
  });
  // ----------------------------------------------

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [countdown, setCountdown] = useState(10);

  const pollInterval = useRef(null);
  const countdownInterval = useRef(null);

  useEffect(() => {
    console.log("🧭 Component mounted: OrderPayment");
    return () => {
      console.log("🧹 Cleaning up intervals...");
      clearInterval(pollInterval.current);
      clearInterval(countdownInterval.current);
    };
  }, []);

  const handlePayment = async () => {
    console.log("🟢 handlePayment triggered...");

    if (!phone) {
      console.warn("⚠️ Phone number missing");
      Alert.alert("Phone Required", "Enter your phone number.");
      return;
    }

    // Normalize phone
    let formattedPhone = phone.trim().replace(/\D/g, "");
    if (formattedPhone.startsWith("0")) formattedPhone = "254" + formattedPhone.slice(1);
    else if (formattedPhone.startsWith("+254")) formattedPhone = formattedPhone.slice(1);
    else if (!formattedPhone.startsWith("254")) formattedPhone = "254" + formattedPhone;

    const payload = { total_price, phone: formattedPhone, user_id, product_id, quantity };
    console.log("📦 Sending M-PESA payment payload:", payload);

    try {
      setLoading(true);
      const res = await ApiSocket.post("/api/mpesa_payment", payload);
      console.log("💰 M-PESA payment response:", res.data);

      if (res.status === 200 && res.data.checkout_request_id) {
        console.log("✅ Checkout request ID received:", res.data.checkout_request_id);
        setCheckoutRequestId(res.data.checkout_request_id);
        setModalVisible(true);
        setPaymentStatus("Pending");
        startPolling(res.data.checkout_request_id);
      } else {
        console.error("❌ Unexpected payment response format:", res.data);
        Alert.alert("Error", "Payment initiation failed.");
      }
    } catch (err) {
      console.error("❌ Payment request failed:", err.response?.data || err.message);
      Alert.alert("Error", "Payment request failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (checkoutId) => {
    console.log("🔁 Starting polling for checkoutId:", checkoutId);
    if (pollInterval.current) clearInterval(pollInterval.current);

    pollInterval.current = setInterval(async () => {
      console.log("🕓 Polling M-PESA status for:", checkoutId);
      try {
        const res = await ApiSocket.get(`/mpesa/check-status/${checkoutId}`);
        const status = res.data?.status;
        console.log("💡 Polling response:", status);

        if (status === "Paid") {
          console.log("✅ Payment confirmed. Fetching order details...");
          clearInterval(pollInterval.current);
          setPaymentStatus("Success");

          const orderRes = await ApiSocket.get(`/mpesa/order-details/${checkoutId}`);
          console.log("📦 Order details response:", orderRes.data);
          setOrderDetails(orderRes.data);
          startCountdown();
        } else if (status === "Failed") {
          console.log("❌ Payment failed according to backend");
          clearInterval(pollInterval.current);
          setPaymentStatus("Failed");
        } else {
          console.log("🕓 Still pending...");
        }
      } catch (err) {
        if (err.response?.status === 404) {
          console.log("⚙️ Polling 404 — session not ready yet, will retry...");
        } else {
          console.error("💥 Polling error:", err.message);
        }
      }
    }, 3000);
  };

  const startCountdown = () => {
    console.log("⏳ Starting countdown to redirect...");
    setCountdown(10);
    countdownInterval.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          console.log("➡️ Countdown finished, redirecting to Activity screen...");
          clearInterval(countdownInterval.current);
          router.push("/Buyer/(tabs)/Activity");
          return 0;
        }
        console.log(`⏰ Countdown: ${prev - 1}s left`);
        return prev - 1;
      });
    }, 1000);
  };

  const closeModal = () => {
    console.log("❌ Closing modal and clearing intervals...");
    setModalVisible(false);
    clearInterval(pollInterval.current);
    clearInterval(countdownInterval.current);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>M-PESA Payment</Text>
      <Text style={styles.info}>Total: KSh {total_price}</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter phone number"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      <TouchableOpacity
        style={styles.payButton}
        onPress={handlePayment}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.payButtonText}>💳 Pay Now</Text>
        )}
      </TouchableOpacity>

      {/* Modal */}
      <Modal transparent visible={modalVisible} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Payment Status</Text>

              {paymentStatus === "Pending" && (
                <Text>Waiting for M-PESA confirmation...</Text>
              )}

              {paymentStatus === "Success" && orderDetails && (
                <>
                  <Text style={{ fontWeight: "700", marginTop: 10 }}>
                    ✅ Payment Successful!
                  </Text>
                  <Text>Redirecting to orders in {countdown} seconds...</Text>
                  <Text>Order ID: {orderDetails.order.order_id}</Text>
                  <Text>Items Purchased:</Text>
                  <View style={{ maxHeight: 250, marginTop: 5 }}>
                    <FlatList
                      data={orderDetails.items}
                      keyExtractor={(item) => item.product_id.toString()}
                      renderItem={({ item }) => (
                        <Text>
                          - Product ID {item.product_id} x {item.quantity} @ KSh{" "}
                          {item.price}
                        </Text>
                      )}
                    />
                  </View>
                </>
              )}

              {paymentStatus === "Failed" && (
                <Text style={{ color: "red" }}>❌ Payment Failed</Text>
              )}

              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20, justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20, textAlign: "center" },
  info: { fontSize: 16, marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 16 },
  payButton: { backgroundColor: "#1b5e20", padding: 14, borderRadius: 10, alignItems: "center" },
  payButtonText: { color: "#fff", fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", padding: 20, borderRadius: 12, width: "90%", maxHeight: "80%" },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 12, textAlign: "center" },
  closeButton: { backgroundColor: "#1b5e20", padding: 10, borderRadius: 8, marginTop: 15, alignItems: "center" },
});

export default OrderPayment;
