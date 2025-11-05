import React, {
  useEffect,
  useImperativeHandle,
  useRef,
  forwardRef,
  useState,
} from "react";
import { View, StyleSheet } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

const { log } = console;

const MapSection = forwardRef(
  (
    {
      mode,
      region,
      onSelectMarker,
      initialFarmers = [],
      initialBuyers = [],
    },
    ref
  ) => {
    const mapRef = useRef(null);
    const [farmers, setFarmers] = useState(initialFarmers);
    const [buyers, setBuyers] = useState(initialBuyers);

    // Allow parent to update markers silently
    useImperativeHandle(ref, () => ({
      updateMarkers(newFarmers, newBuyers) {
        log("🔄 Updating markers...");
        setFarmers(newFarmers || []);
        setBuyers(newBuyers || []);
      },
    }));

    useEffect(() => {
      log("🗺️ MapSection rendered. Mode:", mode);
    }, [mode]);

    const points =
      mode === "picking"
        ? farmers.map((loc) => ({ ...loc, type: "farmer" }))
        : buyers.map((loc) => ({ ...loc, type: "buyer" }));

    const coords = points
      .map((p) => ({
        latitude: parseFloat(p.latitude),
        longitude: parseFloat(p.longitude),
      }))
      .filter((p) => !isNaN(p.latitude) && !isNaN(p.longitude));

    return (
      <View style={{ flex: 1 }}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          region={region}
          showsUserLocation
          showsMyLocationButton
          onMapReady={() => log("✅ Map Ready")}
        >
          {points.map((p, i) => (
            <Marker
              key={i}
              coordinate={{
                latitude: parseFloat(p.latitude),
                longitude: parseFloat(p.longitude),
              }}
              title={p.type === "farmer" ? "Farmer" : "Buyer"}
              description={p.address || p.note || ""}
              pinColor={p.type === "farmer" ? "#2e7d32" : "#1565c0"}
              onPress={() => {
                log("📍 Marker pressed:", p);
                onSelectMarker(p);
              }}
            />
          ))}

          {coords.length >= 2 && (
            <Polyline
              coordinates={coords}
              strokeWidth={4}
              strokeColor="#43a047"
            />
          )}
        </MapView>
      </View>
    );
  }
);

export default MapSection;
