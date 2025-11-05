import React, { useState, useContext, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Animated,
  Keyboard,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { AuthContext } from "../../_Context/Auth.Context";
import ApiSocket from "../ApiSocket";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const OpenTransportService = () => {
  const { user } = useContext(AuthContext);

  const [serviceName, setServiceName] = useState("");
  const [pricePerKm, setPricePerKm] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [route, setRoute] = useState("");
  const [destination, setDestination] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [numberPlate, setNumberPlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);

  const mapHeight = useRef(new Animated.Value(SCREEN_HEIGHT / 2)).current;
  const [mapExpanded, setMapExpanded] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) =>
      setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const toggleMap = () => {
    const newHeight = mapExpanded ? 100 : SCREEN_HEIGHT / 2;
    Animated.timing(mapHeight, {
      toValue: newHeight,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setMapExpanded(!mapExpanded);
  };

  const detectLocation = async () => {
    try {
      setDetecting(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required.");
        setDetecting(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);

      const reverse = await Location.reverseGeocodeAsync(loc.coords);
      if (reverse.length > 0) {
        const addr = reverse[0];
        const formatted = `${addr.name || ""}, ${addr.city || ""}, ${addr.region || ""}`;
        setAddress(formatted);
      }
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to detect location");
    } finally {
      setDetecting(false);
    }
  };

  const openService = async () => {
    if (
      !serviceName ||
      !pricePerKm ||
      !dueDate ||
      !route ||
      !destination ||
      !latitude ||
      !longitude ||
      !address ||
      !phone ||
      !numberPlate
    ) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    try {
      setLoading(true);
      const res = await ApiSocket.post("/open-transport", {
        service_name: serviceName,
        price_per_km: parseFloat(pricePerKm),
        due_date: dueDate,
        transporter_user_id: user.user_id,
        route,
        destination,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address,
        phone,
        number_plate: numberPlate,
      });
      if (res.status === 201) {
        Alert.alert("✅ Success", "Transport service opened successfully");
      }
    } catch (err) {
      console.log(err);
      Alert.alert("Error", err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate remaining height for ScrollView dynamically
  const scrollViewHeight = Animated.add(mapHeight, new Animated.Value(-SCREEN_HEIGHT)).interpolate({
    inputRange: [-SCREEN_HEIGHT, 0, SCREEN_HEIGHT],
    outputRange: [0, 0, SCREEN_HEIGHT - 100 - keyboardHeight], // ensure enough space
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Animated.View style={[styles.mapContainer, { height: mapHeight }]}>
        <TouchableOpacity style={styles.mapToggle} onPress={toggleMap}>
          <Text style={{ color: "#fff" }}>{mapExpanded ? "Collapse Map" : "Expand Map"}</Text>
        </TouchableOpacity>
        {latitude && longitude ? (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude,
              longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            onPress={(e) => {
              const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
              setLatitude(lat);
              setLongitude(lng);
            }}
          >
            <Marker coordinate={{ latitude, longitude }} title="Selected Location" />
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text>Map preview unavailable</Text>
          </View>
        )}
      </Animated.View>

      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 50 + keyboardHeight }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Open Transport Service</Text>

        <TouchableOpacity
          style={styles.detectButton}
          onPress={detectLocation}
          disabled={detecting}
        >
          <Text style={styles.detectText}>
            {detecting ? "Detecting..." : "📍 Detect My Location"}
          </Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Service Name"
          value={serviceName}
          onChangeText={setServiceName}
        />
        <TextInput
          style={styles.input}
          placeholder="Price per KM"
          keyboardType="numeric"
          value={pricePerKm}
          onChangeText={setPricePerKm}
        />
        <TextInput
          style={styles.input}
          placeholder="Due Date (YYYY-MM-DD)"
          value={dueDate}
          onChangeText={setDueDate}
        />
        <TextInput
          style={styles.input}
          placeholder="Route"
          value={route}
          onChangeText={setRoute}
        />
        <TextInput
          style={styles.input}
          placeholder="Destination"
          value={destination}
          onChangeText={setDestination}
        />
        <TextInput
          style={styles.input}
          placeholder="Address"
          value={address}
          onChangeText={setAddress}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <TextInput
          style={styles.input}
          placeholder="Number Plate"
          value={numberPlate}
          onChangeText={setNumberPlate}
        />

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={openService}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Open Service</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  mapContainer: { width: "100%", backgroundColor: "#eee" },
  map: { flex: 1 },
  mapPlaceholder: { flex: 1, justifyContent: "center", alignItems: "center" },
  mapToggle: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: "#43a047",
    padding: 6,
    borderRadius: 6,
  },
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 16 },
  detectButton: {
    backgroundColor: "#43a047",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  detectText: { color: "#fff", fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    fontSize: 15,
  },
  submitBtn: {
    backgroundColor: "#2e7d32",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  submitText: { color: "#fff", fontWeight: "700" },
});

export default OpenTransportService;
