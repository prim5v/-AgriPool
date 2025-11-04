// app/screens/OrderDetails.jsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import ApiSocket from "../ApiSocket";

const OrderDetails = () => {
  const { orderId } = useLocalSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [productsOpen, setProductsOpen] = useState(true); // toggle products visibility

  useEffect(() => {
    if (!orderId) {
      setError("No order ID provided.");
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await ApiSocket.get(`/get-order/${orderId}`);
        const { order, buyer, mpesa_session } = response.data;
        setOrder({ ...order, buyer, mpesa_session });
      } catch (err) {
        console.error("❌ OrderDetails fetch error:", err);
        setError("Failed to fetch order details.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleUpdateOrder = async (action) => {
    if (!order || order.status !== "pending") return;

    try {
      setActionLoading(true);
      const response = await ApiSocket.post(`/update-order-status/${orderId}`, { action });
      setOrder((prev) => ({ ...prev, status: response.data.status }));
      Alert.alert("Success", `Order ${response.data.status} successfully`);
    } catch (err) {
      console.error("❌ UpdateOrder error:", err);
      Alert.alert("Error", "Failed to update order.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCall = (phone) => phone && Linking.openURL(`tel:${phone}`);
  const handleSms = (phone) => phone && Linking.openURL(`sms:${phone}`);
  const handleWhatsApp = (phone) =>
    phone && Linking.openURL(`https://wa.me/${phone.replace(/\D/g, "")}`);

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={{ color: "#2e7d32", marginTop: 10 }}>Loading order...</Text>
      </View>
    );

  if (error)
    return (
      <View style={styles.centered}>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    );

  if (!order)
    return (
      <View style={styles.centered}>
        <Text style={{ color: "#555" }}>No order found.</Text>
      </View>
    );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.details}>
        {/* Order Info */}
        <Text style={styles.sectionTitle}>Order Details</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Order ID:</Text>
          <Text style={styles.infoValue}>{order.order_id}</Text>

          <Text style={styles.infoLabel}>Status:</Text>
          <Text
            style={[
              styles.infoValue,
              order.status === "pending" ? styles.pending : styles.accepted,
            ]}
          >
            {order.status}
          </Text>

          <Text style={styles.infoLabel}>Total Price:</Text>
          <Text style={styles.infoValue}>KSh {order.total_price}</Text>

          <Text style={styles.infoLabel}>Ordered On:</Text>
          <Text style={styles.infoValue}>
            {new Date(order.created_at).toLocaleString()}
          </Text>
        </View>

        {/* Buyer Info */}
        <Text style={styles.sectionTitle}>Buyer Info</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Name:</Text>
          <Text style={styles.infoValue}>{order.buyer?.name || "N/A"}</Text>

          <Text style={styles.infoLabel}>Phone:</Text>
          <Text style={styles.infoValue}>{order.buyer?.phone || "N/A"}</Text>

          <View style={styles.contactButtons}>
            {order.buyer?.phone && (
              <>
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => handleCall(order.buyer.phone)}
                >
                  <Text style={styles.contactText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => handleSms(order.buyer.phone)}
                >
                  <Text style={styles.contactText}>SMS</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => handleWhatsApp(order.buyer.phone)}
                >
                  <Text style={styles.contactText}>WhatsApp</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{order.buyer?.email || "N/A"}</Text>
        </View>

        {/* Payment Info */}
        {order.mpesa_session && (
          <>
            <Text style={styles.sectionTitle}>Payment Info</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>MPESA Code:</Text>
              <Text style={styles.infoValue}>
                {order.mpesa_session.mpesa_code || "N/A"}
              </Text>

              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{order.mpesa_session.phone || "N/A"}</Text>

              <View style={styles.contactButtons}>
                {order.mpesa_session.phone && (
                  <>
                    <TouchableOpacity
                      style={styles.contactButton}
                      onPress={() => handleCall(order.mpesa_session.phone)}
                    >
                      <Text style={styles.contactText}>Call</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.contactButton}
                      onPress={() => handleSms(order.mpesa_session.phone)}
                    >
                      <Text style={styles.contactText}>SMS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.contactButton}
                      onPress={() => handleWhatsApp(order.mpesa_session.phone)}
                    >
                      <Text style={styles.contactText}>WhatsApp</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={styles.infoValue}>
                {order.mpesa_session.status || "N/A"}
              </Text>
            </View>
          </>
        )}

        {/* Products */}
        <TouchableOpacity
          style={styles.toggleProducts}
          onPress={() => setProductsOpen(!productsOpen)}
        >
          <Text style={styles.sectionTitle}>
            {productsOpen ? "▼" : "▶"} Products in this Order (
            {order.items?.length || 0})
          </Text>
        </TouchableOpacity>
        {productsOpen &&
          (order.items?.length > 0 ? (
            order.items.map((item, idx) => (
              <View key={idx} style={styles.productCard}>
                <Text style={styles.productName}>{item.product_name}</Text>
                <Text style={styles.productInfo}>
                  Quantity: {item.quantity} {item.unit}
                </Text>
                <Text style={styles.productInfo}>Price: KSh {item.price}</Text>
              </View>
            ))
          ) : (
            <Text style={{ fontSize: 14, color: "#555", fontStyle: "italic" }}>
              No products found for this order.
            </Text>
          ))}

        {/* Action Buttons: Accept & Reject */}
        {order.status === "pending" && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.acceptButton, { flex: 1, marginRight: 5 }]}
              onPress={() => handleUpdateOrder("accept")}
              disabled={actionLoading}
            >
              <Text style={styles.acceptText}>
                {actionLoading ? "Processing..." : "Accept"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.rejectButton, { flex: 1, marginLeft: 5 }]}
              onPress={() => handleUpdateOrder("reject")}
              disabled={actionLoading}
            >
              <Text style={styles.rejectText}>
                {actionLoading ? "Processing..." : "Reject"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {order.service_id === null && (
          <TouchableOpacity
            style={styles.transportButton}
            onPress={() =>
              router.push(`/screens/BookTransport?orderId=${order.order_id}`)
            }
          >
            <Text style={styles.transportText}>Book Transport</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back to Orders</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 50 },
  details: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#1b5e20", marginBottom: 8 },
  infoCard: { backgroundColor: "#fff", padding: 12, borderRadius: 8, marginBottom: 12, elevation: 2 },
  infoLabel: { fontSize: 14, fontWeight: "700", color: "#333", marginTop: 6 },
  infoValue: { fontSize: 14, color: "#555", marginTop: 2 },
  contactButtons: { flexDirection: "row", marginTop: 8 },
  contactButton: {
    backgroundColor: "#2e7d32",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 6,
  },
  contactText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  productCard: { padding: 10, backgroundColor: "#fff", borderRadius: 6, marginBottom: 10, elevation: 1 },
  productName: { fontSize: 15, fontWeight: "700", color: "#333" },
  productInfo: { fontSize: 14, color: "#555", marginTop: 2 },
  toggleProducts: { marginTop: 12 },
  buttonContainer: { marginTop: 12 },
  acceptButton: { backgroundColor: "#2e7d32", paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  acceptText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  rejectButton: { backgroundColor: "#d32f2f", paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  rejectText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  transportButton: { backgroundColor: "#1565c0", paddingVertical: 12, borderRadius: 8, marginTop: 10, alignItems: "center" },
  transportText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  backButton: { marginTop: 20, paddingVertical: 10, alignSelf: "flex-start" },
  backText: { color: "#2e7d32", fontSize: 15, fontWeight: "600" },
  pending: { color: "#d32f2f", fontWeight: "700" },
  accepted: { color: "#2e7d32", fontWeight: "700" },
  actionRow: { flexDirection: "row", marginTop: 12 },
});

export default OrderDetails;
