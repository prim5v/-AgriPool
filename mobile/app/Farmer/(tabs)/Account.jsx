import React, { useEffect, useState, useContext, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { AuthContext } from "../../../_Context/Auth.Context";
import ProfileHeader from "../../components/ProfileHeader";
import VerifyAccount from "../../components/VerifyAccount";
import Earnings from "../../components/Earnings";
import Ratings from "../../components/Ratings";

export default function AccountScreen() {
  const router = useRouter();
  const { user, setUser, logout } = useContext(AuthContext);
  const [localUser, setLocalUser] = useState(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) setLocalUser(JSON.parse(userData));
    } catch (error) {
      console.log("Error loading user:", error);
    }
  };

  useEffect(() => {
    loadUser();
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUser();
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      await AsyncStorage.removeItem("user");
      router.replace("/Auth/Login"); // ✅ correct route for expo-router
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  if (!localUser) {
    return (
      <View style={styles.container}>
        <Text>Loading user...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Account</Text>
        <TouchableOpacity onPress={() => setSettingsVisible(true)}>
          <Ionicons name="settings-outline" size={26} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content with Pull-to-Refresh */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#0077b6"]}
            tintColor="#0077b6"
          />
        }
      >
        <ProfileHeader user={localUser} setUser={setLocalUser} />
        {!localUser.verified && (
          <VerifyAccount user={localUser} setUser={setLocalUser} />
        )}
        <Earnings user={localUser} />
        <Ratings user={localUser} />
      </ScrollView>

      {/* Settings Modal */}
      <Modal
        visible={settingsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <TouchableOpacity style={styles.modalItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#dc3545" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setSettingsVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#333" },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalBox: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    elevation: 10,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 10,
  },
  logoutText: { color: "#dc3545", fontWeight: "bold", fontSize: 16 },
  modalCancel: { marginTop: 15, alignItems: "center" },
  cancelText: { color: "#0077b6", fontSize: 16 },
});
