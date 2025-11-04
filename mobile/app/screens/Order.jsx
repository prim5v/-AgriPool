import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import ApiSocket from "../ApiSocket";

const Order = () => {
  const { product_id, quantity, checkoutData } = useLocalSearchParams();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrderData = async () => {
      try {
        setLoading(true);

        if (checkoutData) {
          // ✅ Multi-item checkout (data comes from cart)
          const parsed = JSON.parse(checkoutData);
          setItems(parsed);
        } else if (product_id) {
          // ✅ Single product checkout (fetch full product details)
          const res = await ApiSocket.get(`/get-product-details/${product_id}`);
          setItems([
            {
              ...res.data,
              product_id,
              quantity: parseInt(quantity || 1),
              selling_price: res.data.selling_price || res.data.price,
            },
          ]);
        } else {
          console.error("❌ No product_id or checkoutData found.");
        }
      } catch (err) {
        console.error("❌ Order fetch error:", err.message);
      } finally {
        setLoading(false);
      }
    };

    loadOrderData();
  }, [product_id, checkoutData]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={{ color: "#2e7d32", marginTop: 10 }}>Loading order...</Text>
      </View>
    );
  }

  if (!items || items.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: "#555" }}>No items found.</Text>
      </View>
    );
  }

  const grandTotal = items.reduce(
    (sum, x) => sum + parseFloat(x.selling_price || x.price) * x.quantity,
    0
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Order Summary</Text>

      {items.map((item, index) => (
        <View key={index} style={styles.card}>
          <Image
            source={{
              uri:
                item.images && item.images.length > 0
                  ? item.images[0]
                  : "https://via.placeholder.com/80",
            }}
            style={styles.image}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.product_name}</Text>
            <Text style={styles.details}>
              Qty: {item.quantity} × KSh {item.selling_price || item.price}
            </Text>
            <Text style={styles.total}>
              = KSh{" "}
              {(
                parseFloat(item.selling_price || item.price) * item.quantity
              ).toFixed(2)}
            </Text>
          </View>
        </View>
      ))}

      <View style={styles.grandTotalBox}>
        <Text style={styles.grandTotalText}>
          Grand Total: KSh {grandTotal.toFixed(2)}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.confirmButton}
        onPress={() =>
          router.push({
            pathname: "/screens/LocationSharing",
            params: {
              checkoutData: JSON.stringify(items),
              total_price: grandTotal,
            },
          })
        }
      >
        <Text style={styles.confirmButtonText}>✅ Confirm Order</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20, color: "#1b5e20" },
  card: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
  },
  image: { width: 80, height: 80, borderRadius: 8, marginRight: 10 },
  name: { fontSize: 16, fontWeight: "600", color: "#333" },
  details: { fontSize: 14, color: "#555", marginTop: 4 },
  total: { fontSize: 15, fontWeight: "700", color: "#2e7d32", marginTop: 4 },
  grandTotalBox: {
    borderTopWidth: 1,
    borderColor: "#ddd",
    paddingTop: 12,
    marginTop: 20,
  },
  grandTotalText: { fontSize: 18, fontWeight: "700", color: "#1b5e20" },
  confirmButton: {
    backgroundColor: "#1b5e20",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  confirmButtonText: { color: "#fff", fontWeight: "700" },
  backButton: { padding: 10, alignItems: "center" },
  backButtonText: { color: "#2e7d32", fontWeight: "700" },
});

export default Order;
