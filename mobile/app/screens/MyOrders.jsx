import React, { useEffect, useState, useContext, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "../../_Context/Auth.Context";
import ApiSocket from "../ApiSocket";

const statuses = ["Unpaid", "To Be Shipped", "Shipped", "Arrived", "Cancelled"];

const MyOrders = () => {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeStatus, setActiveStatus] = useState("Unpaid");
  const [counts, setCounts] = useState({});

  const fetchOrders = useCallback(async () => {
    if (!user?.user_id) return;

    try {
      if (!refreshing) setLoading(true);
      const res = await ApiSocket.get(`/api/order_activities/${user.user_id}`);
      setOrders(res.data.orders || []);
      setCounts(res.data.counts || {});
    } catch (err) {
      console.error("❌ Fetch orders error:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, refreshing]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 60000); // silent refresh
    return () => clearInterval(interval);
  }, [fetchOrders]);

  useEffect(() => {
    const filtered = orders.filter((o) => o.status === activeStatus);
    setFilteredOrders(filtered);
  }, [orders, activeStatus]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={{ color: "#2e7d32", marginTop: 10 }}>Loading orders...</Text>
      </View>
    );

  const renderHeader = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabRow}
    >
      {statuses.map((status) => (
        <TouchableOpacity
          key={status}
          style={styles.tabContainer}
          onPress={() => setActiveStatus(status)}
        >
          <Text style={[styles.tabText, activeStatus === status && styles.activeTabText]}>
            {status} ({counts[status] || 0})
          </Text>
          {activeStatus === status && <View style={styles.underline} />}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <FlatList
      data={filteredOrders}
      keyExtractor={(item) => item.order_id}
      contentContainerStyle={{ paddingBottom: 20 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={renderHeader}
      renderItem={({ item }) => (
        <View style={styles.orderCard}>
          <Text style={styles.orderId}>Order ID: {item.order_id}</Text>
          <Text style={styles.status}>{item.status}</Text>
          {item.items.map((p) => (
            <View key={p.product_id} style={styles.productRow}>
              <Text style={styles.productName}>{p.product_name}</Text>
              <Text style={styles.productQty}>Qty: {p.quantity}</Text>
            </View>
          ))}

          {/* Total and Pay Now button on the same line */}
          <View style={styles.totalRow}>
            <Text style={styles.total}>Total: KSh {item.total_price}</Text>
            {item.status === "Unpaid" && (
              <TouchableOpacity
                style={styles.buyNowButton}
                onPress={() =>
                  router.push({
                    pathname: "/screens/Order",
                    params: {
                      checkoutData: JSON.stringify(item.items),
                      total_price: item.total_price,
                    },
                  })
                }
              >
                <Text style={styles.buyNowText}>💰 Pay Now</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={{ color: "#555" }}>No orders found for {activeStatus}</Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  tabRow: { paddingHorizontal: 12, paddingVertical: 8 },
  tabContainer: { paddingHorizontal: 10, alignItems: "center", marginRight: 12 },
  tabText: { fontWeight: "600", color: "#555", fontSize: 14 },
  activeTabText: { color: "#2e7d32" },
  underline: { height: 2, width: "100%", backgroundColor: "#2e7d32", marginTop: 2, borderRadius: 1 },
  orderCard: { backgroundColor: "#f8f8f8", borderRadius: 12, padding: 12, marginBottom: 10, marginHorizontal: 12 },
  orderId: { fontWeight: "700", color: "#1b5e20" },
  status: { fontWeight: "700", color: "#d32f2f", marginBottom: 5 },
  productRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 2 },
  productName: { fontSize: 14 },
  productQty: { fontSize: 14, fontWeight: "600" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  total: { fontWeight: "700", color: "#1b5e20" },
  buyNowButton: {
    backgroundColor: "#d32f2f",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  buyNowText: {
    color: "#fff",
    fontWeight: "700",
  },
});

export default MyOrders;
