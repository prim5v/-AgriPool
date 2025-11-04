// app/ApiSocket.js

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";     
import Constants from "expo-constants";  

const API_BASE_URL = Constants.expoConfig.extra?.API_BASE_URL || "https://backendagripool4293.pythonanywhere.com";

const ApiSocket = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});  


// Automatically attach token for protected routes
ApiSocket.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default ApiSocket;
