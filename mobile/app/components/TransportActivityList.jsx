import React, { useEffect, useState, useCallback, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native";
import { AuthContext } from "../../_Context/Auth.Context";
import ApiSocket from "../ApiSocket";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const STATUSES = ["open", "full", "picking", "inTransit", "dropping", "completed"];

const TransportActivityList = ({ showAddButton = true }) => {
  const { user } = useContext(AuthContext);
  const router = useRouter();

  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [counts, setCounts] = useState({});
  const [activeStatus, setActiveStatus] = useState("open");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchServices = useCallback(async () => {
    if (!user?.user_id) return;
    try {
      if (!refreshing) setLoading(true);
      const res = await ApiSocket.get(`/get_Transport_services/${user.user_id}`);
      const all = res.data.services_data || [];
      setServices(all);

      const c = {};
      STATUSES.forEach((s) => {
        c[s] = all.filter((x) => x.service.status === s).length;
      });
      setCounts(c);
    } catch (err) {
      console.log("❌ fetchServices error:", err.message);
      setServices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, refreshing]);

  useEffect(() => {
    fetchServices();
    const interval = setInterval(fetchServices, 30000);
    return () => clearInterval(interval);
  }, [fetchServices]);

  useEffect(() => {
    const filtered = services.filter((s) => s.service.status === activeStatus);
    setFilteredServices(filtered);
  }, [services, activeStatus]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchServices();
  };

  const updateStatus = async (serviceId, newStatus) => {
    try {
      const res = await ApiSocket.post("/update-transport_service-status", {
        service_id: serviceId,
        status: newStatus,
        transporter_user_id: user.user_id,
        user_id: user.user_id,
      });
      if (res.status === 200) {
        Alert.alert("✅ Success", `Status updated to ${newStatus}`);
        fetchServices();
      }
    } catch (err) {
      console.log("❌ updateStatus error:", err.message);
      Alert.alert("Error", err.response?.data?.error || err.message);
    }
  };

  const renderTabs = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
      {STATUSES.map((status) => (
        <TouchableOpacity
          key={status}
          onPress={() => setActiveStatus(status)}
          style={[styles.tab, activeStatus === status && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeStatus === status && styles.activeTabText]}>
            {status.toUpperCase()} ({counts[status] || 0})
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={{ color: "#2e7d32", marginTop: 10 }}>Loading services...</Text>
      </View>
    );

  return (
    <View style={{ flex: 1 }}>
      {showAddButton && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/screens/OpenTransportService")}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      <FlatList
        data={filteredServices}
        keyExtractor={(item) => item.service.service_id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={renderTabs}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text>No services found for {activeStatus.toUpperCase()}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const { service, bookings } = item;
          const nextStatus =
            service.status === "open"
              ? "picking"
              : service.status === "picking"
              ? "inTransit"
              : service.status === "inTransit"
              ? "dropping"
              : "Completed";

          return (
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.serviceId}>ID: {service.service_id}</Text>
                <Text style={styles.status}>{service.status}</Text>
              </View>
              <Text>Vehicle: {service.vehicle_plate || "N/A"}</Text>
              <Text>Capacity: {service.capacity || "N/A"}</Text>
              <Text>Bookings: {bookings.length}</Text>

              <View style={styles.rowBetween}>
                <TouchableOpacity
                  style={styles.detailsBtn}
                  onPress={() =>
                    router.push({
                      pathname: "/screens/TransportDetails",
                      params: { service: JSON.stringify(item) },
                    })
                  }
                >
                  <Text style={styles.detailsText}>View Details</Text>
                </TouchableOpacity>

                {service.status !== "completed" && (
                  <TouchableOpacity
                    style={styles.updateBtn}
                    onPress={() => updateStatus(service.service_id, nextStatus)}
                  >
                    <Text style={styles.updateText}>Next Stage</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  tabRow: { paddingHorizontal: 10, paddingVertical: 8 },
  tab: { paddingHorizontal: 12, paddingVertical: 6, marginRight: 10, borderRadius: 8, backgroundColor: "#eee" },
  activeTab: { backgroundColor: "#2e7d32" },
  tabText: { color: "#555", fontWeight: "600" },
  activeTabText: { color: "#fff" },
  card: {
    backgroundColor: "#fafafa",
    borderRadius: 10,
    marginHorizontal: 12,
    marginVertical: 6,
    padding: 12,
    elevation: 2,
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  serviceId: { fontWeight: "700", color: "#1b5e20" },
  status: { fontWeight: "700", color: "#d32f2f" },
  detailsBtn: { backgroundColor: "#4caf50", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  detailsText: { color: "#fff", fontWeight: "700" },
  updateBtn: { backgroundColor: "#ff9800", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  updateText: { color: "#fff", fontWeight: "700" },
  addButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    zIndex: 100,
    backgroundColor: "#2e7d32",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
});

export default TransportActivityList;
