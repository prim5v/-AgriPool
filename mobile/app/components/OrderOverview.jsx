import React, { useEffect, useState, useContext, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "../../_Context/Auth.Context";
import ApiSocket from "../ApiSocket";
import { MaterialCommunityIcons, FontAwesome5, Feather } from "@expo/vector-icons";

const statuses = [
  { key: "Unpaid", icon: <FontAwesome5 name="wallet" size={24} color="#fff" />, color: "#d32f2f" },
  { key: "To Be Shipped", icon: <MaterialCommunityIcons name="package-variant-closed" size={24} color="#fff" />, color: "#f9a825" },
  { key: "Shipped", icon: <MaterialCommunityIcons name="truck" size={24} color="#fff" />, color: "#1976d2" },
  { key: "Arrived", icon: <Feather name="check-circle" size={24} color="#fff" />, color: "#388e3c" },
  { key: "Cancelled", icon: <Feather name="x-circle" size={24} color="#fff" />, color: "#555" }
];

const OrderOverview = () => {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCounts = useCallback(async () => {
    if (!user?.user_id) return;
    try {
      if (!refreshing) setLoading(true);
      const res = await ApiSocket.get(`/api/order_activities/${user.user_id}`);
      setCounts(res.data.counts || {});
    } catch (err) {
      console.error("❌ Fetch order counts error:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, refreshing]);

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 60000); // 1 minute silent refresh
    return () => clearInterval(interval);
  }, [fetchCounts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCounts();
  };

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={{ color: "#2e7d32", marginTop: 10 }}>Loading order overview...</Text>
      </View>
    );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      style={styles.container}
    >
      {statuses.map((status) => (
        <TouchableOpacity
          key={status.key}
          style={[styles.card, { backgroundColor: status.color }]}
          onPress={() => router.push({ pathname: "/screens/MyOrders", params: { status: status.key } })}
        >
          {status.icon}
          <Text style={styles.cardText}>{status.key}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{counts[status.key] || 0}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { paddingVertical: 10, paddingHorizontal: 12 },
  card: {
    width: 80,
    height: 90,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginRight: 12
  },
  cardText: { color: "#fff", fontSize: 12, fontWeight: "700", marginTop: 5, textAlign: "center" },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "red",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center"
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 50 }
});

export default OrderOverview;
