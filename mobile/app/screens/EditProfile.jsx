import React, { useState, useCallback, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ApiSocket from "../ApiSocket";
import { AuthContext } from "../../_Context/Auth.Context";

export default function EditProfile() {
  const router = useRouter();
  const { user: userData } = useLocalSearchParams();
  const { setUser } = useContext(AuthContext);

  const user = JSON.parse(userData || "{}");

  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
  });

  const [refreshing, setRefreshing] = useState(false);

  // Pull-to-refresh profile data from API
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await ApiSocket.get(`/api/user/${user.user_id}`);
      if (res.data.success && res.data.user) {
        setFormData({
          name: res.data.user.name,
          email: res.data.user.email,
          phone: res.data.user.phone,
        });
      }
    } catch (err) {
      console.log(err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Save profile edits
  const handleSave = async () => {
    try {
      const res = await ApiSocket.put(`/api/user/${user.user_id}`, formData);
      if (res.data.success) {
        const updatedUser = { ...user, ...formData };
        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser); // ✅ Update global context immediately
        Alert.alert("✅ Success", "Profile updated successfully");
        router.back();
      } else {
        Alert.alert("Error", res.data.message || "Update failed");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Could not update profile");
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>

      <View style={styles.iconWrap}>
        <Ionicons name="person-circle-outline" size={120} color="#0077b6" />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
      />

      <TextInput
        style={[styles.input, { backgroundColor: "#f0f0f0" }]}
        placeholder="Email"
        value={formData.email}
        editable={false}
      />

      <TextInput
        style={styles.input}
        placeholder="Phone"
        value={formData.phone}
        onChangeText={(text) => setFormData({ ...formData, phone: text })}
      />

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Feather name="save" size={18} color="#fff" />
        <Text style={styles.saveText}>Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  backBtn: {
    padding: 5,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  iconWrap: {
    alignItems: "center",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    marginVertical: 6,
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: "#2d6a4f",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginTop: 20,
    width: "100%",
  },
  saveText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 6,
    fontSize: 16,
  },
});
