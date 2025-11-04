// app/components/ProfileOverview.jsx
import React, { useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../_Context/Auth.Context";

const ProfileOverview = () => {
  const { user, logout } = useContext(AuthContext);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/Auth/Login"); // navigate to login screen
  };

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Ionicons name="person-circle-outline" size={40} color="#fff" />
        <Text style={styles.username}>{user?.name || "Guest"}</Text>
      </View>

      <TouchableOpacity onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default ProfileOverview;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#2d6a4f", // green background
    borderRadius: 12,
    marginBottom: 16,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 12 },
  username: { fontSize: 18, fontWeight: "bold", color: "#fff" },
});
