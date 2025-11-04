import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";

const MapCard = ({ service }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        // 🔒 Request permission
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "Location access is required to show your position.");
          setLoading(false);
          return;
        }

        // 📍 Get current user location
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.log("Location error:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (userLocation && service?.latitude && service?.longitude && mapRef.current) {
      const points = [
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        },
        {
          latitude: parseFloat(service.latitude),
          longitude: parseFloat(service.longitude),
        },
      ];

      // 🗺️ Fit map to show both markers
      mapRef.current.fitToCoordinates(points, {
        edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
        animated: true,
      });
    }
  }, [userLocation, service]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text>Loading map...</Text>
      </View>
    );
  }

  const transporterCoords = {
    latitude: parseFloat(service.latitude || -1.286389),
    longitude: parseFloat(service.longitude || 36.817223),
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: transporterCoords.latitude,
          longitude: transporterCoords.longitude,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        }}
      >
        {/* 🟢 Transporter marker */}
        <Marker
          coordinate={transporterCoords}
          pinColor="green"
          title={service.service_name}
          description={`${service.route} → ${service.destination}`}
        />

        {/* 🔵 User marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            pinColor="blue"
            title="You"
            description="Your current location"
          />
        )}
      </MapView>

      <View style={styles.bottom}>
        <Text style={styles.title}>{service.service_name}</Text>
        <Text style={styles.text}>Route: {service.route}</Text>
        <Text style={styles.text}>Destination: {service.destination}</Text>
        <Text style={styles.text}>Price per km: Ksh {service.price_per_km}</Text>
        <Text style={styles.text}>Vehicle: {service.number_plate}</Text>
        {service.address && <Text style={styles.text}>Address: {service.address}</Text>}
        {service.phone && <Text style={styles.text}>Phone: {service.phone}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 10,
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  map: { height: 200, width: "100%" },
  bottom: {
    backgroundColor: "#fff",
    padding: 12,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    elevation: 4,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#1b5e20" },
  text: { fontSize: 14, color: "#444", marginTop: 4 },
  center: { justifyContent: "center", alignItems: "center", height: 200 },
});

export default MapCard;
