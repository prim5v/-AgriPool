import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import ApiSocket from "../ApiSocket";
import { AuthContext } from "../../_Context/Auth.Context";

const GOOGLE_API_KEY = "YOUR_GOOGLE_API_KEY"; // <-- Replace with your actual key

const LocationSharing = () => {
  console.log("🚀 LocationSharing component mounted");

  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useContext(AuthContext);
  const user_id = user?.user_id;

  // --- Normalize order params ---
  let checkoutItems = [];
  if (params.checkoutData) {
    try {
      checkoutItems = JSON.parse(params.checkoutData);
      console.log("📦 Parsed checkoutData:", checkoutItems);
    } catch (err) {
      console.error("❌ Failed to parse checkoutData:", err);
    }
  } else if (params.product_id) {
    const singleQuantity = Array.isArray(params.quantity)
      ? params.quantity.map(Number)
      : [Number(params.quantity || 1)];

    checkoutItems = [
      {
        product_id: Array.isArray(params.product_id)
          ? params.product_id[0]
          : String(params.product_id),
        quantity: singleQuantity[0],
        product_name: params.product_name || "Unknown",
        selling_price: Number(params.unit_price || params.price || 0),
      },
    ];
    console.log("📦 Single-product checkout normalized:", checkoutItems);
  }

  // Extract arrays for payload
  const product_id = checkoutItems.map((item) => item.product_id);
  const quantity = checkoutItems.map((item) => Number(item.quantity));
  const product_name = checkoutItems.map((item) => item.product_name);
  const unit_price = checkoutItems.map((item) =>
    Number(item.selling_price || item.price)
  );
  const total_price =
    Number(params.total_price) ||
    checkoutItems.reduce(
      (sum, item) => sum + (item.selling_price || item.price) * item.quantity,
      0
    );

  console.log("💡 Normalized Params ->", {
    product_id,
    quantity,
    total_price,
    product_name,
    unit_price,
    user_id,
  });

  // --- State ---
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [landmark, setLandmark] = useState("");
  const [instructions, setInstructions] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // --- Detect GPS location ---
  const detectLocation = async () => {
    console.log("📡 Starting detectLocation...");
    try {
      setDetecting(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log("🧾 Location permission status:", status);
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required.");
        setDetecting(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      console.log("✅ Got raw location data:", loc);
      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);

      const reverse = await Location.reverseGeocodeAsync(loc.coords);
      console.log("📬 Reverse geocode data:", reverse);

      if (reverse.length > 0) {
        const addr = reverse[0];
        const formatted = `${addr.name || ""}, ${addr.city || ""}, ${addr.region || ""}`;
        setAddress(formatted);
        console.log("🏠 Set formatted address:", formatted);
      }

      console.log("📍 Final detected coords:", loc.coords);
    } catch (err) {
      console.error("❌ Location detection error:", err);
      Alert.alert("Error", "Failed to detect location automatically.");
    } finally {
      setDetecting(false);
      console.log("📡 detectLocation finished");
    }
  };

  // --- Google Places autocomplete ---
  const searchPlaces = async (query) => {
    console.log("🔍 Searching places for query:", query);
    if (!query) {
      console.log("⚠️ Empty search query, clearing results");
      return setSearchResults([]);
    }

    try {
      const resp = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query
        )}&key=${GOOGLE_API_KEY}&types=geocode`
      );
      const data = await resp.json();
      console.log("🗺️ Google autocomplete response:", data);
      setSearchResults(data.predictions || []);
    } catch (err) {
      console.error("❌ Places search error:", err);
    }
  };

  const selectPlace = async (placeId) => {
    console.log("📍 Selecting place with ID:", placeId);
    try {
      const resp = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_API_KEY}`
      );
      const data = await resp.json();
      console.log("🗺️ Place details API response:", data);

      const loc = data.result.geometry.location;
      setLatitude(loc.lat);
      setLongitude(loc.lng);
      setAddress(data.result.formatted_address);
      setSearchResults([]);
      setSearchQuery("");
      console.log("✅ Selected place ->", data.result.formatted_address, loc);
    } catch (err) {
      console.error("❌ Place details error:", err);
    }
  };

  // --- Submit location + order info ---
  const handleSubmit = async () => {
    console.log("🚚 handleSubmit triggered");

    if (!address || !phone) {
      console.warn("⚠️ Missing address or phone");
      Alert.alert("Missing Info", "Please enter your address and phone number.");
      return;
    }
    if (!latitude || !longitude) {
      console.warn("⚠️ Missing coordinates");
      Alert.alert("Location Required", "Detect or search for a location first.");
      return;
    }

    let formattedPhone = phone.trim().replace(/\D/g, "");
    if (formattedPhone.startsWith("0")) formattedPhone = "254" + formattedPhone.slice(1);
    else if (formattedPhone.startsWith("+254")) formattedPhone = formattedPhone.slice(1);
    else if (!formattedPhone.startsWith("254")) formattedPhone = "254" + formattedPhone;

    const payload = {
      user_id: String(user_id),
      latitude,
      longitude,
      address,
      phone: formattedPhone,
      landmark,
      instructions,
      product_id,
      quantity,
      total_price,
      product_name,
      unit_price,
    };

    console.table(payload); // ✅ Log nicely for debugging

    try {
      setLoading(true);
      console.log("📤 Sending payload to /api/location/share...");
      const res = await ApiSocket.post("/api/location/share", payload);
      console.log("✅ API response:", res.status, res.data);

      if (res.status === 201) {
        Alert.alert("✅ Success", "Location shared successfully!");
        console.log("➡️ Navigating to OrderPayment...");
        router.push({
          pathname: "/screens/OrderPayment",
          params: { product_id, quantity, total_price, product_name, unit_price, user_id },
        });
      } else {
        console.warn("⚠️ Unexpected response status:", res.status);
      }
    } catch (err) {
      console.error("❌ Submit error:", err);
      Alert.alert("Error", "Failed to share location. Try again.");
    } finally {
      setLoading(false);
      console.log("📤 handleSubmit completed");
    }
  };

  useEffect(() => {
    console.log("🔁 useEffect mounted -> ready for interaction");
  }, []);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.container}>
        {/* Search bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a location"
            value={searchQuery}
            onChangeText={(text) => {
              console.log("⌨️ Search input changed:", text);
              setSearchQuery(text);
            }}
          />
          <TouchableOpacity style={styles.searchButton} onPress={() => searchPlaces(searchQuery)}>
            <MaterialIcons name="search" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {searchResults.length > 0 && (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => {
                  console.log("🖱️ Pressed result item:", item.description);
                  selectPlace(item.place_id);
                }}
              >
                <Text>{item.description}</Text>
              </TouchableOpacity>
            )}
            style={styles.resultsList}
          />
        )}

        {/* Map Section */}
        <View style={styles.mapContainer}>
          {latitude && longitude ? (
            <MapView
              style={styles.map}
              region={{
                latitude,
                longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              showsUserLocation
              onRegionChangeComplete={(region) => console.log("🗺️ Map region changed:", region)}
            >
              <Marker coordinate={{ latitude, longitude }} title="Selected Location" />
            </MapView>
          ) : (
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapText}>Map preview unavailable</Text>
            </View>
          )}
        </View>

        {/* Form Section */}
        <ScrollView
          style={styles.formContainer}
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Confirm Delivery Location</Text>

          <TouchableOpacity style={styles.detectButton} onPress={detectLocation} disabled={detecting}>
            <Text style={styles.detectButtonText}>
              {detecting ? "Detecting..." : "📍 Detect My Location"}
            </Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Address"
            value={address}
            onChangeText={(text) => {
              console.log("🏠 Address input changed:", text);
              setAddress(text);
            }}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(text) => {
              console.log("📞 Phone input changed:", text);
              setPhone(text);
            }}
          />
          <TextInput
            style={styles.input}
            placeholder="Nearby Landmark (optional)"
            value={landmark}
            onChangeText={(text) => {
              console.log("📍 Landmark input changed:", text);
              setLandmark(text);
            }}
          />
          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder="Additional Instructions (optional)"
            multiline
            value={instructions}
            onChangeText={(text) => {
              console.log("📝 Instructions changed:", text);
              setInstructions(text);
            }}
          />

          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>🧾 Order Summary</Text>
            <Text style={styles.summaryText}>Product: {product_name.join(", ")}</Text>
            <Text style={styles.summaryText}>Quantity: {quantity.join(", ")}</Text>
            <Text style={styles.summaryText}>Unit Price: KSh {unit_price.join(", ")}</Text>
            <Text style={styles.summaryTotal}>Total: KSh {total_price}</Text>
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>🚚 Confirm & Send</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  searchContainer: {
    flexDirection: "row",
    margin: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    overflow: "hidden",
  },
  searchInput: { flex: 1, padding: 10, fontSize: 15 },
  searchButton: {
    backgroundColor: "#43a047",
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  resultItem: { padding: 8, borderBottomWidth: 1, borderBottomColor: "#ddd" },
  resultsList: {
    maxHeight: 150,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },
  mapContainer: { flex: 1, height: "40%" },
  map: { flex: 1 },
  mapPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eee",
  },
  mapText: { color: "#777" },
  formContainer: { flex: 1, backgroundColor: "#fff", padding: 16 },
  title: { fontSize: 22, fontWeight: "700", color: "#1b5e20", marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 15,
  },
  detectButton: {
    backgroundColor: "#43a047",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: "center",
  },
  detectButtonText: { color: "#fff", fontWeight: "700" },
  summaryBox: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    backgroundColor: "#f9f9f9",
  },
  summaryTitle: { fontWeight: "700", marginBottom: 5, color: "#2e7d32" },
  summaryText: { fontSize: 14, color: "#333" },
  summaryTotal: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 6,
    color: "#1b5e20",
  },
  submitButton: {
    backgroundColor: "#1b5e20",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: { color: "#fff", fontWeight: "700" },
  backButton: { marginTop: 12, alignItems: "center" },
  backText: { color: "#2e7d32", fontWeight: "600" },
});

export default LocationSharing;
