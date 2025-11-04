import React, { useState, useEffect, useContext, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { useRouter, useLocalSearchParams } from "expo-router";
import ApiSocket from "../ApiSocket";
import { AuthContext } from "../../_Context/Auth.Context";

// 🔹 Format phone number to 254XXXXXXXXX
const formatPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) return "254" + cleaned.slice(1);
  if (cleaned.startsWith("7")) return "254" + cleaned;
  if (cleaned.startsWith("254")) return cleaned;
  return cleaned;
};

// 🔔 Payment Modal with countdown redirect
const PaymentModal = ({ visible, service, status, onClose, countdownStart = 10 }) => {
  const [countdown, setCountdown] = useState(countdownStart);
  const timerRef = useRef(null);

  useEffect(() => {
    if (status === "Paid") {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            onClose(status);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [status]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="slide" visible={visible}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContent}>
          {service && (
            <>
              <Text style={styles.modalTitle}>{service.service_name}</Text>
              <Text>Route: {service.route}</Text>
              <Text>Vehicle: {service.vehicle_description}</Text>
              <Text>Price/km: KES {service.price_per_km}</Text>
            </>
          )}
          <View style={{ marginVertical: 20 }}>
            {status === "Processing" && <Text>Processing payment... ⏳</Text>}
            {status === "Paid" && <Text style={styles.success}>Payment Successful ✅</Text>}
            {status === "Failed" && <Text style={styles.failed}>Payment Failed ❌</Text>}
          </View>
          {status === "Paid" && <Text>Redirecting in {countdown} seconds...</Text>}
          {status === "Failed" && (
            <TouchableOpacity style={styles.okButton} onPress={() => onClose(status)}>
              <Text style={styles.okText}>Try Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const BookTransport = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useContext(AuthContext);

  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);

  const [farmerLocation, setFarmerLocation] = useState({
    latitude: "",
    longitude: "",
    address: "",
    phone: "",
    landmark: "",
    instructions: "",
  });

  const [mapRegion, setMapRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("Processing");
  const [checkoutRequestId, setCheckoutRequestId] = useState(null);

  // Fetch orders and location
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!user?.user_id) return;
        const res = await ApiSocket.get(`/farmer/orders-with-services/${user.user_id}`);
        const data = res.data;
        if (!data.success) return;
        setOrders(data.orders || []);
        setServices(data.available_transport_services || []);
        if (params?.orderId && params?.buyersUserId) {
          const preSelected = data.orders.find(
            (o) =>
              o.order.order_id === params.orderId &&
              o.buyer.user_id === params.buyersUserId
          );
          if (preSelected) setSelectedOrder(preSelected);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const loc = await Location.getCurrentPositionAsync({});
        setFarmerLocation((prev) => ({
          ...prev,
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        }));
        setMapRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      } catch (err) {
        console.error(err);
      }
    };

    fetchOrders();
    getLocation();
  }, [user]);

  const handleInputChange = (key, value) =>
    setFarmerLocation((prev) => ({ ...prev, [key]: value }));

  // 🔹 Book Transport & initiate STK Push
  const handleBookTransport = async () => {
    if (!selectedService) return;
    const requiredFields = ["latitude", "longitude", "phone"];
    const missing = requiredFields.filter((f) => !farmerLocation[f]);
    if (missing.length) return;

    setBookingLoading(true);
    setPaymentStatus("Processing");
    setPaymentModalVisible(true);

    try {
      const payload = {
        farmers_user_id: user.user_id,
        buyers_user_id: selectedOrder.buyer.user_id,
        service_id: selectedService.service_id,
        order_id: selectedOrder.order.order_id,
        phone: formatPhone(farmerLocation.phone),
        latitude: farmerLocation.latitude,
        longitude: farmerLocation.longitude,
        address: farmerLocation.address,
        landmark: farmerLocation.landmark,
        instructions: farmerLocation.instructions,
      };

      const res = await ApiSocket.post("/book-transport", payload);
      if (res.data.status === "success") {
        setCheckoutRequestId(res.data.checkout_request_id);

        // 🔹 3-second polling
        const pollInterval = setInterval(async () => {
          try {
            const pollRes = await ApiSocket.get(
              `/mpesa/check-status/${res.data.checkout_request_id}`
            );
            const status = pollRes.data.status;
            if (status === "Paid" || status === "Failed") {
              clearInterval(pollInterval);
              setPaymentStatus(status);
              if (status === "Paid") {
                setTimeout(() => router.push("/Farmer/(tabs)/Activity"), 10000);
              }
            }
          } catch (err) {
            console.error(err);
          }
        }, 3000);
      } else {
        setPaymentStatus("Failed");
      }
    } catch (err) {
      console.error(err);
      setPaymentStatus("Failed");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading || !mapRegion)
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#4CAF50" />;

  if (!selectedOrder) {
    return (
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.sectionTitle}>Select Order to Book Transport</Text>
        {orders.filter((o) => !o.order.service_id).map((order) => (
          <TouchableOpacity
            key={order.order.order_id}
            style={styles.orderCard}
            onPress={() => setSelectedOrder(order)}
          >
            <Text>Order ID: {order.order.order_id}</Text>
            <Text>Total Price: KES {order.order.total_price}</Text>
            <Text>Buyer: {order.buyer?.name || "N/A"}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>
          Select Transport Service for Order {selectedOrder.order.order_id} ({services.length} available)
        </Text>

        <MapView style={{ width: "100%", height: 300 }} region={mapRegion}>
          <Marker
            coordinate={{
              latitude: parseFloat(farmerLocation.latitude),
              longitude: parseFloat(farmerLocation.longitude),
            }}
            title="Your Location"
            pinColor="blue"
          />
          {services.map((s) =>
            s.latitude && s.longitude ? (
              <Marker
                key={s.service_id}
                coordinate={{
                  latitude: parseFloat(s.latitude),
                  longitude: parseFloat(s.longitude),
                }}
                title={s.service_name}
                description={`Vehicle: ${s.vehicle_description}\nPrice/km: KES ${s.price_per_km}`}
                pinColor={selectedService?.service_id === s.service_id ? "green" : "red"}
                onPress={() => setSelectedService(s)}
              />
            ) : null
          )}
        </MapView>

        {selectedService && (
          <>
            <Text style={styles.sectionTitle}>Selected Service: {selectedService.service_name}</Text>
            <Text>Route: {selectedService.route}</Text>
            <Text>Vehicle: {selectedService.vehicle_description}</Text>
            <Text>Price per km: KES {selectedService.price_per_km}</Text>

            <Text style={styles.sectionTitle}>Your Location Info</Text>
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={farmerLocation.phone}
              onChangeText={(text) => handleInputChange("phone", text)}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Address"
              value={farmerLocation.address}
              onChangeText={(text) => handleInputChange("address", text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Landmark (optional)"
              value={farmerLocation.landmark}
              onChangeText={(text) => handleInputChange("landmark", text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Instructions (optional)"
              value={farmerLocation.instructions}
              onChangeText={(text) => handleInputChange("instructions", text)}
            />

            <TouchableOpacity
              style={styles.bookButton}
              onPress={handleBookTransport}
              disabled={bookingLoading}
            >
              <Text style={styles.bookButtonText}>
                {bookingLoading ? "Processing..." : "Book Transport & Pay"}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <PaymentModal
          visible={paymentModalVisible}
          service={selectedService}
          status={paymentStatus}
          onClose={() => setPaymentModalVisible(false)}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 18, fontWeight: "700", marginVertical: 10, color: "#1b5e20" },
  orderCard: { backgroundColor: "#fff", padding: 12, borderRadius: 8, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginVertical: 5 },
  bookButton: { backgroundColor: "#4CAF50", padding: 15, borderRadius: 8, marginTop: 10, alignItems: "center" },
  bookButtonText: { color: "#fff", fontWeight: "700" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", padding: 30, borderRadius: 12, alignItems: "center", width: "80%" },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 10 },
  success: { fontSize: 22, fontWeight: "700", color: "green", marginBottom: 10 },
  failed: { fontSize: 22, fontWeight: "700", color: "red", marginBottom: 10 },
  okButton: { marginTop: 20, padding: 12, backgroundColor: "#4CAF50", borderRadius: 8 },
  okText: { color: "#fff", fontWeight: "700" },
});

export default BookTransport;
