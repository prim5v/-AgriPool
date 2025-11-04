import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import ApiSocket from "../ApiSocket";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function VerifyAccount({ user, setUser }) {
  const [nationalId, setNationalId] = useState("");

  const handleVerify = async () => {
    if (!nationalId.trim()) {
      Alert.alert("Error", "Enter your National ID");
      return;
    }

    try {
      const res = await ApiSocket.post(`/api/verify/${user.id}`, { national_id: nationalId });
      if (res.data.success) {
        const updatedUser = { ...user, verified: 1, national_id: nationalId };
        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        setNationalId("");
        Alert.alert("✅ Verified", "Your account has been verified!");
      } else {
        Alert.alert("Verification Failed", res.data.message || "Try again later");
      }
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to verify account");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Account to Start Earning 💰</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your National ID"
        value={nationalId}
        onChangeText={setNationalId}
        keyboardType="numeric"
      />
      <TouchableOpacity style={styles.button} onPress={handleVerify}>
        <Text style={styles.buttonText}>Verify Now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff0f0",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  title: { fontWeight: "bold", color: "#dc3545", marginBottom: 10, fontSize: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#dc3545",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
});
