// app/context/InfoContext.jsx
import React, { createContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ApiSocket from "../app/ApiSocket"; // your file
import io from "socket.io-client";
import Constants from "expo-constants";

export const InfoContext = createContext(null);

export const InfoProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [weather, setWeather] = useState(null);
  const [market, setMarket] = useState({
    prices: {},
    activeDeliveries: null,
    trucksNearby: 0,
    earningsWeek: 0,
  });
  const [notifications, setNotifications] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = Constants.expoConfig?.extra?.API_BASE_URL || "https://backendagripool4293.pythonanywhere.com";
  const SOCKET_URL = API_BASE.replace(/^http/, "ws");

  // Load user from storage
  const loadUser = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw));
    } catch (err) {
      console.warn("Failed to load user from storage", err);
    }
  }, []);

  // Basic fetchers
  const fetchWeather = useCallback(async (lat, lon) => {
    try {
      // Use your backend endpoint that returns weather OR directly call OpenWeatherMap here.
      // Example: ApiSocket.get("/weather?lat=...&lon=...")
      const resp = await ApiSocket.get(`/weather?lat=${lat}&lon=${lon}`);
      setWeather(resp.data);
    } catch (err) {
      console.warn("weather fetch failed", err);
    }
  }, []);

  const fetchMarket = useCallback(async () => {
    try {
      const { data } = await ApiSocket.get("/market/summary");
      setMarket({
        prices: data.prices || {},
        activeDeliveries: data.activeDeliveries,
        trucksNearby: data.trucksNearby || 0,
        earningsWeek: data.earningsWeek || 0,
      });
    } catch (err) {
      console.warn("market fetch failed", err);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await ApiSocket.get("/notifications");
      setNotifications(data || []);
    } catch (err) {
      console.warn("notification fetch failed", err);
    }
  }, []);

  const fetchInsights = useCallback(async () => {
    try {
      const { data } = await ApiSocket.get("/insights");
      setInsights(data || []);
    } catch (err) {
      console.warn("insights fetch failed", err);
    }
  }, []);

  // Polling + socket for real-time
  useEffect(() => {
    let socket;
    (async () => {
      await loadUser();
      await fetchMarket();
      await fetchNotifications();
      await fetchInsights();
      setLoading(false);

      // open socket (if backend supports)
      try {
        socket = io(SOCKET_URL, { transports: ["websocket"] });
        socket.on("connect", () => console.log("socket connected"));
        socket.on("market:update", (payload) => setMarket(prev => ({ ...prev, ...payload })));
        socket.on("notification:new", (n) => setNotifications(prev => [n, ...prev]));
        socket.on("weather:update", (w) => setWeather(w));
      } catch (err) {
        console.warn("socket error", err);
      }
    })();

    // Polling fallback every 30s for market/notifications
    const interval = setInterval(() => {
      fetchMarket();
      fetchNotifications();
    }, 30000);

    return () => {
      clearInterval(interval);
      if (socket) socket.disconnect();
    };
  }, [fetchMarket, fetchNotifications, loadUser, fetchInsights]);

  // Helpful helper to refresh everything
  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([fetchMarket(), fetchNotifications(), fetchInsights()]);
    setLoading(false);
  };

  return (
    <InfoContext.Provider value={{
      user,
      setUser,
      weather,
      market,
      notifications,
      insights,
      loading,
      refreshAll,
      fetchWeather,
    }}>
      {children}
    </InfoContext.Provider>
  );
};
