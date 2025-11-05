import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { AuthContext } from "../../_Context/Auth.Context";
import ApiSocket from "../ApiSocket";

const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.09;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const TransportDetails = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useContext(AuthContext);

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState(null);

  useEffect(() => {
    if (!params.service) {
      Alert.alert("Error", "No service data provided");
      router.back();
      return;
    }

    try {
      const parsed = JSON.parse(params.service);
      setService(parsed);

      const pickupLat = parseFloat(parsed.service.pickup_lat);
      const pickupLng = parseFloat(parsed.service.pickup_lng);
      if (pickupLat && pickupLng) {
        setRegion({
          latitude: pickupLat,
          longitude: pickupLng,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        });
      } else {
        getCurrentLocation();
      }
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to parse service data");
      router.back();
    } finally {
      setLoading(false);
    }
  }, [params.service]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location access is required to show map");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
    } catch (err) {
      console.log("Location error:", err);
    }
  };

  const getNextStatus = (status) => {
    switch (status) {
      case "open":
        return "full";
      case "full":
        return "picking";
      case "picking":
        return "inTransit";
      case "inTransit":
        return "Dropping";
      case "Dropping":
        return "Completed";
      default:
        return null;
    }
  };

  const getButtonLabel = (status) => {
    switch (status) {
      case "open":
        return "Mark Full / Close";
      case "full":
        return "Start Picking";
      case "picking":
        return "Start Transporting";
      case "inTransit":
        return "Start Dropping";
      case "Dropping":
        return "Confirm Completion";
      case "Completed":
        return "Completed";
      default:
        return "Update";
    }
  };

  const updateStatus = async () => {
    if (!service) return;
    const svc = service.service;
    const nextStatus = getNextStatus(svc.status);
    if (!nextStatus) return;

    try {
      setLoading(true);
      const res = await ApiSocket.post("/update-transport_service-status", {
        service_id: svc.service_id,
        status: nextStatus,
        transporter_user_id: user.user_id,
        user_id: user.user_id,
      });

      if (res.status === 200) {
        Alert.alert("✅ Success", `Status updated to ${nextStatus}`);
        setService({ ...service, service: { ...svc, status: nextStatus } });
      } else {
        Alert.alert("Error", res.data?.error || "Failed to update status");
      }
    } catch (err) {
      console.log("❌ Update error:", err);
      Alert.alert("Error", err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !service) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={{ marginTop: 10, color: "#2e7d32" }}>Loading service details...</Text>
      </View>
    );
  }

  const { bookings, farmers_info, farmers_locations, buyers_info, buyers_locations } = service;
  const svc = service.service;

  return (
    <ScrollView style={styles.container}>
      {region && (
        <MapView style={styles.map} region={region} showsUserLocation showsCompass loadingEnabled>
          <Marker
            coordinate={{
              latitude: parseFloat(svc.pickup_lat) || region.latitude,
              longitude: parseFloat(svc.pickup_lng) || region.longitude,
            }}
            title="Pickup Location"
            pinColor="green"
          />
          {svc.dropoff_lat && svc.dropoff_lng && (
            <Marker
              coordinate={{
                latitude: parseFloat(svc.dropoff_lat),
                longitude: parseFloat(svc.dropoff_lng),
              }}
              title="Dropoff Location"
              pinColor="orange"
            />
          )}
          {farmers_locations?.map((loc, idx) => (
            <Marker
              key={`farmer-${idx}`}
              coordinate={{
                latitude: parseFloat(loc.latitude),
                longitude: parseFloat(loc.longitude),
              }}
              title={farmers_info[idx]?.name || "Farmer"}
              pinColor="blue"
            />
          ))}
          {buyers_locations?.map((loc, idx) => (
            <Marker
              key={`buyer-${idx}`}
              coordinate={{
                latitude: parseFloat(loc.latitude),
                longitude: parseFloat(loc.longitude),
              }}
              title={buyers_info[idx]?.name || "Buyer"}
              pinColor="purple"
            />
          ))}
        </MapView>
      )}

      <Text style={styles.title}>Transport Service Details</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Service ID:</Text>
        <Text style={styles.value}>{svc.service_id}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Vehicle Plate:</Text>
        <Text style={styles.value}>{svc.vehicle_plate || "N/A"}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Capacity:</Text>
        <Text style={styles.value}>{svc.capacity || "N/A"}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Current Status:</Text>
        <Text style={styles.value}>{svc.status}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Bookings:</Text>
        {bookings.length === 0 ? (
          <Text style={styles.value}>No bookings yet</Text>
        ) : (
          bookings.map((b, idx) => {
            const farmer = farmers_info.find(f => f.user_id === b.farmers_user_id);
            const buyer = buyers_info.find(bu => bu.user_id === b.buyers_user_id);

            return (
              <TouchableOpacity
                key={idx}
                style={styles.bookingCard}
                onPress={() => router.push({ pathname: "/screens/Booking", params: { booking: JSON.stringify(b) } })}
              >
                <Text style={styles.bookingTitle}>
                  🧾 Booking #{b.booking_id} — {b.status.toUpperCase()}
                </Text>
                <Text style={styles.bookingText}>Farmer: {farmer?.name || b.farmers_user_id}</Text>
                <Text style={styles.bookingText}>Buyer: {buyer?.name || b.buyers_user_id}</Text>
                <Text style={styles.bookingText}>
                  Distance: {b.distance_km} km | Price: Ksh {b.total_price}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {svc.status !== "Completed" && (
        <TouchableOpacity style={styles.updateBtn} onPress={updateStatus}>
          <Text style={styles.updateText}>{getButtonLabel(svc.status)}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

export default TransportDetails;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  map: { width: "100%", height: 250, marginBottom: 20, borderRadius: 10 },
  title: { fontSize: 22, fontWeight: "700", marginHorizontal: 16, color: "#1b5e20" },
  section: { marginHorizontal: 16, marginBottom: 12 },
  label: { fontWeight: "600", color: "#555" },
  value: { fontSize: 16, marginTop: 4 },
  bookingCard: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  bookingTitle: { fontWeight: "700", marginBottom: 4, color: "#2e7d32" },
  bookingText: { fontSize: 14, color: "#333" },
  updateBtn: {
    backgroundColor: "#ff9800",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 25,
    marginBottom: 60,
  },
  updateText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
