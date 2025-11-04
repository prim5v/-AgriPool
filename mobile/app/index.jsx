// app/index.jsx
import React, { useContext, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "../_Context/Auth.Context";


export default function Index() {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user?.role === "Farmer") {
        router.replace("/Farmer/(tabs)/Home");
      } else if (user?.role === "Buyer") {
        router.replace("/Buyer/(tabs)/Home");
      } else if (user?.role === "Transporter") {
        router.replace("/Transporter/(tabs)/Home");
      } else {
        router.replace("/Auth/Login"); // redirect to login if no user
      }
    }
  }, [loading, user]);

  // Show loader while AuthContext initializes
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" color="#99744A" />
      </View>
    );
  }

  return null;
}
