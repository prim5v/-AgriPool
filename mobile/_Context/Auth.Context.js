import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ApiSocket from "../app/ApiSocket";


export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // loading while checking token

  // Auto-login effect
  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedToken = await AsyncStorage.getItem("token");
        if (!savedToken) {
          setLoading(false);
          return;
        }

        console.log("[DEBUG] Token found in storage:", savedToken);
        // Validate token by calling /profile
        const profileRes = await ApiSocket.get("/profile", {
          headers: { Authorization: `Bearer ${savedToken}` },
        });

        if (profileRes.data?.user) {
          console.log("[DEBUG] Token valid, user data fetched:", profileRes.data.user);
          setToken(savedToken);
          setUser(profileRes.data.user);
        } else {
          console.warn("[DEBUG] Token invalid or expired, clearing storage");
          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("user");
        }
      } catch (err) {
        console.error("[ERROR] Auto-login failed:", err);
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Signup
  const signup = async (username, email, password, role) => {
    const res = await ApiSocket.post("/signup", { username, email, password, role });
    return res.data;
  };

  // OTP verification
  const verifyOTP = async (otp) => {
    const res = await ApiSocket.post("/verify-otp", { otp });
    return res.data;
  };

  // Login
  const login = async (email, password) => {
    const res = await ApiSocket.post("/login", { email, password });
    const token = res.data.token;

    // Save token
    await AsyncStorage.setItem("token", token);
    setToken(token);

    // Fetch profile
    const profileRes = await ApiSocket.get("/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const userData = profileRes.data.user;

    setUser(userData);
    await AsyncStorage.setItem("user", JSON.stringify(userData));
    return userData;
  };

  // Logout
  const logout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, setUser, loading, signup, verifyOTP, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
