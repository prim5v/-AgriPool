import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function ProfileHeader({ user }) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons
          name="person-circle-outline"
          size={90}
          color={user.verified ? "#0077b6" : "#dc3545"}
        />
        {user.verified ? (
          <MaterialIcons
            name="verified"
            size={22}
            color="#0077b6"
            style={styles.badge}
          />
        ) : (
          <MaterialIcons
            name="error-outline"
            size={22}
            color="#dc3545"
            style={styles.badge}
          />
        )}
      </View>

      <Text style={styles.name}>{user.name || "Unnamed User"}</Text>
      <Text style={styles.role}>{user.role || "User"}</Text>

      <TouchableOpacity
        style={styles.editBtn}
        onPress={() => router.push({ pathname: "/screens/EditProfile", params: { user: JSON.stringify(user) } })}
      >
        <Feather name="edit-3" size={18} color="#2d6a4f" />
        <Text style={styles.editText}>Edit Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", marginBottom: 20 },
  iconWrap: { position: "relative" },
  badge: { position: "absolute", bottom: 0, right: 5 },
  name: { fontSize: 20, fontWeight: "bold", color: "#333", marginTop: 8 },
  role: { color: "#555", marginBottom: 8 },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  editText: { marginLeft: 5, color: "#2d6a4f", fontWeight: "bold" },
});
