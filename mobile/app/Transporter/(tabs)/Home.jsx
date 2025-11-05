import React, { useState, useEffect, useRef, useCallback, useContext } from "react";
import {
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Animated,
  View,
} from "react-native";
import * as Location from "expo-location";
import ApiSocket from "../../ApiSocket";
import MapSection from "../../components/MapSection";
import CurtainOverlay from "../../components/CurtainOverlay";
import BookingBottomSheet from "../../components/BookingBottomSheet";
import HeaderInfo from "../../components/HeaderInfo";
import { AuthContext } from "../../../_Context/Auth.Context";

const { log } = console;

export default function Home() {
  const { user } = useContext(AuthContext);
  const transporterUserId = user?.user_id || "";

  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null);
  const [service, setService] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [region, setRegion] = useState(null);
  const [showCurtain, setShowCurtain] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [statusUpdated, setStatusUpdated] = useState(false);

  const mapRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // === Curtain Animation ===
  const openCurtain = useCallback(() => {
    setShowCurtain(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const closeCurtain = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowCurtain(false));
  }, []);

  // === Get Current Location ===
  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") throw new Error("Permission denied");
      const loc = await Location.getCurrentPositionAsync({});
      return {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    } catch (err) {
      console.warn("❌ Location error:", err.message);
      return null;
    }
  };

  // === Update service status ===
  const updateServiceStatus = async (serviceId, newStatus) => {
    try {
      log(`⚙️ Updating service ${serviceId} → ${newStatus}`);
      const res = await ApiSocket.post(`/update-transport_service-status`, {
        service_id: serviceId,
        status: newStatus,
        transporter_user_id: transporterUserId,
      });
      if (res.status === 200) {
        log(`✅ Service ${serviceId} successfully updated → ${newStatus}`);
        setStatusUpdated(true);
        return true;
      } else {
        log("⚠️ updateServiceStatus failed:", res.data);
        return false;
      }
    } catch (err) {
      log("❌ updateServiceStatus error:", err.message);
      return false;
    }
  };

  // === Fetch Active Route Info ===
  const fetchRouteInfo = useCallback(
    async (silent = false) => {
      if (!transporterUserId) {
        log("⚠️ No transporter_user_id found. Aborting fetch.");
        if (!silent) setShowCurtain(true);
        setLoading(false);
        return;
      }

      if (!silent) setLoading(true);
      if (!silent) setShowCurtain(false);

      try {
        let data = null;

        // === Step 1: Get Picking Info ===
        const pickRes = await ApiSocket.get(
          `/get_picking_routes_info/${transporterUserId}`
        ).catch((err) => err.response);
        log("📦 Picking Response:", pickRes?.status);

        const bookingsData = pickRes?.data?.bookings || [];

        // === Step 2: Transit fallback if needed ===
        const transitRes = await ApiSocket.get(
          `/get_transit_routes_info/${transporterUserId}`
        ).catch((err) => err.response);
        log("🚚 Transit Response:", transitRes?.status);

        // === Step 3: Picking found but no bookings & Transit missing → Update status ===
        if (
          pickRes?.status === 200 &&
          pickRes.data?.service &&
          bookingsData.length === 0 &&
          transitRes?.status === 404 &&
          !statusUpdated
        ) {
          log("🚨 Picking=200 + Transit=404 + No bookings → Updating to inTransit...");
          await updateServiceStatus(pickRes.data.service.service_id, "inTransit");
          return;
        }

        // === Step 4: Normal picking mode ===
        if (pickRes?.status === 200 && pickRes.data?.service && bookingsData.length > 0) {
          data = pickRes.data;
          setMode("picking");
          log("✅ Picking service found with bookings.");
        }
        // === Step 5: Direct Transit mode ===
        else if (transitRes?.status === 200 && transitRes.data?.service) {
          data = transitRes.data;
          setMode("in_transit");
          log("✅ Transit service found.");
          setShowCurtain(false);
        } else {
          log("⚠️ No active picking or transit service found.");
          if (!silent) setShowCurtain(true);
          setMode(null);
        }

        // === Step 6: Update state and map ===
        if (data) {
          setService(data.service);
          setBookings(data.bookings || []);
          mapRef.current?.updateMarkers(
            data.farmers_locations || [],
            data.buyers_locations || []
          );
        }

        if (!region) {
          const myLoc = await getLocation();
          if (myLoc) setRegion(myLoc);
        }
      } catch (err) {
        log("❌ fetchRouteInfo error:", err.message);
        if (!silent) setShowCurtain(true);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [transporterUserId, region, statusUpdated]
  );

  useEffect(() => {
    fetchRouteInfo();
  }, [fetchRouteInfo]);

  // === Auto-refresh ===
  useEffect(() => {
    if (showCurtain) return;
    const interval = setInterval(() => fetchRouteInfo(true), 3000);
    return () => clearInterval(interval);
  }, [fetchRouteInfo, showCurtain]);

  // === Complete Service if all bookings done ===
  const tryCompleteService = async () => {
    if (!service) return;
    const pending = bookings.filter((b) => b.status !== "completed");
    if (pending.length === 0) {
      log("🏁 All deliveries completed → Updating to Completed");
      try {
        const res = await ApiSocket.post(`/update-transport_service-status`, {
          service_id: service.service_id,
          status: "Completed",
          transporter_user_id: transporterUserId,
        });
        if (res.status === 200) {
          Alert.alert("All deliveries completed!", "Tap OK to refresh.", [
            { text: "OK", onPress: fetchRouteInfo },
          ]);
        }
      } catch (err) {
        log("❌ tryCompleteService error:", err.message);
      }
    }
  };

  useEffect(() => {
    if (bookings.length > 0) tryCompleteService();
  }, [bookings]);

  // === Marker select ===
  const handleMarkerSelect = (markerData) => {
    log("📍 Marker pressed:", markerData);
    setSelectedBooking(markerData);
    openCurtain();
  };

  if (loading || !region) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" color="#1b5e20" />
      </SafeAreaView>
    );
  }

  log("🎯 Rendering Home screen. Mode:", mode);

  const curtainTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [500, 0],
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ flex: 1 }}>
        {/* === Map === */}
        <MapSection
          ref={mapRef}
          mode={mode}
          region={region}
          initialFarmers={service?.farmers_locations || []}
          initialBuyers={service?.buyers_locations || []}
          onSelectMarker={handleMarkerSelect}
        />

        {/* === Header === */}
        {mode && <HeaderInfo mode={mode} vehiclePlate={service?.vehicle_plate} />}

        {/* === Curtain === */}
        {showCurtain && (
          <CurtainOverlay
            mode={mode}
            service_id={service?.service_id}
            booking={selectedBooking}
            transporterUserId={transporterUserId}
            onStatusUpdated={fetchRouteInfo}
          />
        )}

        {/* === Bottom Sheet === */}
        <Animated.View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            transform: [{ translateY: curtainTranslateY }],
          }}
        >
          <BookingBottomSheet
            mode={mode}
            selectedBooking={selectedBooking}
            onClose={closeCurtain}
            onConfirm={fetchRouteInfo}
            service={service}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}







// import React, { useState, useEffect, useRef, useCallback, useContext } from "react";
// import {
//   SafeAreaView,
//   ActivityIndicator,
//   Alert,
//   Animated,
//   View,
// } from "react-native";
// import * as Location from "expo-location";
// import ApiSocket from "../../ApiSocket";
// import MapSection from "../../components/MapSection";
// import CurtainOverlay from "../../components/CurtainOverlay";
// import BookingBottomSheet from "../../components/BookingBottomSheet";
// import HeaderInfo from "../../components/HeaderInfo";
// import { AuthContext } from "../../../_Context/Auth.Context";

// const { log } = console;

// export default function Home() {
//   const { user } = useContext(AuthContext);
//   const transporterUserId = user?.user_id || "";

//   const [loading, setLoading] = useState(true);
//   const [mode, setMode] = useState(null);
//   const [service, setService] = useState(null);
//   const [bookings, setBookings] = useState([]);
//   const [region, setRegion] = useState(null);
//   const [showCurtain, setShowCurtain] = useState(false);
//   const [selectedBooking, setSelectedBooking] = useState(null);
//   const [statusUpdated, setStatusUpdated] = useState(false);

//   const mapRef = useRef(null);
//   const slideAnim = useRef(new Animated.Value(0)).current;

//   // === Curtain Animation ===
//   const openCurtain = useCallback(() => {
//     setShowCurtain(true);
//     Animated.timing(slideAnim, {
//       toValue: 1,
//       duration: 400,
//       useNativeDriver: true,
//     }).start();
//   }, []);

//   const closeCurtain = useCallback(() => {
//     Animated.timing(slideAnim, {
//       toValue: 0,
//       duration: 300,
//       useNativeDriver: true,
//     }).start(() => setShowCurtain(false));
//   }, []);

//   // === Get Current Location ===
//   const getLocation = async () => {
//     try {
//       const { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== "granted") throw new Error("Permission denied");
//       const loc = await Location.getCurrentPositionAsync({});
//       return {
//         latitude: loc.coords.latitude,
//         longitude: loc.coords.longitude,
//         latitudeDelta: 0.05,
//         longitudeDelta: 0.05,
//       };
//     } catch (err) {
//       console.warn("❌ Location error:", err.message);
//       return null;
//     }
//   };

//   // === Update service status ===
//   const updateServiceStatus = async (serviceId, newStatus) => {
//     try {
//       log(`⚙️ Updating service ${serviceId} → ${newStatus}`);
//       const res = await ApiSocket.post(`/update-transport_service-status`, {
//         service_id: serviceId,
//         status: newStatus,
//         transporter_user_id: transporterUserId,
//       });
//       if (res.status === 200) {
//         log(`✅ Service ${serviceId} successfully updated → ${newStatus}`);
//         setStatusUpdated(true);
//         return true;
//       } else {
//         log("⚠️ updateServiceStatus failed:", res.data);
//         return false;
//       }
//     } catch (err) {
//       log("❌ updateServiceStatus error:", err.message);
//       return false;
//     }
//   };

//   // === Fetch Active Route Info ===
//   const fetchRouteInfo = useCallback(
//     async (silent = false) => {
//       if (!transporterUserId) {
//         log("⚠️ No transporter_user_id found. Aborting fetch.");
//         if (!silent) setShowCurtain(true);
//         setLoading(false);
//         return;
//       }

//       if (!silent) setLoading(true);
//       if (!silent) setShowCurtain(false);

//       try {
//         let data = null;

//         // === Step 1: Get Picking Info ===
//         const pickRes = await ApiSocket.get(
//           `/get_picking_routes_info/${transporterUserId}`
//         ).catch((err) => err.response);
//         log("📦 Picking Response:", pickRes?.status);

//         // === Step 2: If Picking Exists ===
//         if (pickRes?.status === 200 && pickRes.data?.service) {
//           const bookingsData = pickRes.data.bookings || [];

//           log("📊 Bookings count (picking):", bookingsData.length);

//           // === Step 3: Check Transit fallback ===
//           const transitRes = await ApiSocket.get(
//             `/get_transit_routes_info/${transporterUserId}`
//           ).catch((err) => err.response);
//           log("🚚 Transit Response:", transitRes?.status);

//           // === Step 4: Handle no bookings and transit missing ===
//           if (
//             bookingsData.length === 0 &&
//             transitRes?.status === 404 &&
//             !statusUpdated
//           ) {
//             log("🚨 Picking=200 + Transit=404 + No bookings → Updating to inTransit...");
//             await updateServiceStatus(pickRes.data.service.service_id, "inTransit");
//             return;
//           }

//           // === Step 5: Normal picking mode ===
//           if (bookingsData.length > 0) {
//             data = pickRes.data;
//             setMode("picking");
//             log("✅ Picking service found with bookings.");
//           }
//         } else {
//           // === Step 6: Try direct Transit fetch ===
//           const transitRes = await ApiSocket.get(
//             `/get_transit_routes_info/${transporterUserId}`
//           ).catch((err) => err.response);
//           log("🚚 Transit Response:", transitRes?.status);

//           if (transitRes?.status === 200 && transitRes.data?.service) {
//             data = transitRes.data;
//             setMode("in_transit");
//             log("✅ Transit service found.");
//             setShowCurtain(false);
//           } else {
//             log("⚠️ No active picking or transit service found.");
//             if (!silent) setShowCurtain(true);
//             setMode(null);
//           }
//         }

//         // === Step 7: Update map and region ===
//         if (data) {
//           setService(data.service);
//           setBookings(data.bookings || []);
//           mapRef.current?.updateMarkers(
//             data.farmers_locations || [],
//             data.buyers_locations || []
//           );
//         }

//         if (!region) {
//           const myLoc = await getLocation();
//           if (myLoc) setRegion(myLoc);
//         }
//       } catch (err) {
//         log("❌ fetchRouteInfo error:", err.message);
//         if (!silent) setShowCurtain(true);
//       } finally {
//         if (!silent) setLoading(false);
//       }
//     },
//     [transporterUserId, region, statusUpdated]
//   );

//   useEffect(() => {
//     fetchRouteInfo();
//   }, [fetchRouteInfo]);

//   // === Auto-refresh ===
//   useEffect(() => {
//     if (showCurtain) return;
//     const interval = setInterval(() => fetchRouteInfo(true), 3000);
//     return () => clearInterval(interval);
//   }, [fetchRouteInfo, showCurtain]);

//   // === Complete Service if all bookings done ===
//   const tryCompleteService = async () => {
//     if (!service) return;
//     const pending = bookings.filter((b) => b.status !== "completed");
//     if (pending.length === 0) {
//       log("🏁 All deliveries completed → Updating to Completed");
//       try {
//         const res = await ApiSocket.post(`/update-transport_service-status`, {
//           service_id: service.service_id,
//           status: "Completed",
//           transporter_user_id: transporterUserId,
//         });
//         if (res.status === 200) {
//           Alert.alert("All deliveries completed!", "Tap OK to refresh.", [
//             { text: "OK", onPress: fetchRouteInfo },
//           ]);
//         }
//       } catch (err) {
//         log("❌ tryCompleteService error:", err.message);
//       }
//     }
//   };

//   useEffect(() => {
//     if (bookings.length > 0) tryCompleteService();
//   }, [bookings]);

//   // === Marker select ===
//   const handleMarkerSelect = (markerData) => {
//     log("📍 Marker pressed:", markerData);
//     setSelectedBooking(markerData);
//     openCurtain();
//   };

//   if (loading || !region) {
//     return (
//       <SafeAreaView
//         style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
//       >
//         <ActivityIndicator size="large" color="#1b5e20" />
//       </SafeAreaView>
//     );
//   }

//   log("🎯 Rendering Home screen. Mode:", mode);

//   const curtainTranslateY = slideAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: [500, 0],
//   });

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
//       <View style={{ flex: 1 }}>
//         {/* === Map === */}
//         <MapSection
//           ref={mapRef}
//           mode={mode}
//           region={region}
//           initialFarmers={service?.farmers_locations || []}
//           initialBuyers={service?.buyers_locations || []}
//           onSelectMarker={handleMarkerSelect}
//         />

//         {/* === Header === */}
//         {mode && <HeaderInfo mode={mode} vehiclePlate={service?.vehicle_plate} />}

//         {/* === Curtain === */}
//         {showCurtain && (
//           <CurtainOverlay
//             mode={mode}
//             service_id={service?.service_id}
//             booking={selectedBooking}
//             transporterUserId={transporterUserId}
//             onStatusUpdated={fetchRouteInfo}
//           />
//         )}

//         {/* === Bottom Sheet === */}
//         <Animated.View
//           style={{
//             position: "absolute",
//             left: 0,
//             right: 0,
//             bottom: 0,
//             transform: [{ translateY: curtainTranslateY }],
//           }}
//         >
//           <BookingBottomSheet
//             mode={mode}
//             selectedBooking={selectedBooking}
//             onClose={closeCurtain}
//             onConfirm={fetchRouteInfo}
//             service={service}
//           />
//         </Animated.View>
//       </View>
//     </SafeAreaView>
//   );
// }
