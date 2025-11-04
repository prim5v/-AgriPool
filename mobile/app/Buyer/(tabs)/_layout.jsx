import React, { useEffect, useState, useContext } from "react";
import { View, Text, StatusBar } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ApiSocket from "../../ApiSocket";
import { AuthContext } from "../../../_Context/Auth.Context";

export default function TabLayout() {
  const { user } = useContext(AuthContext);
  const [cartCount, setCartCount] = useState(0);

  // 🔄 Fetch cart count for logged-in user
  useEffect(() => {
    if (!user?.user_id) return;

    const fetchCartCount = async () => {
      try {
        const res = await ApiSocket.get(`/api/cart/count/${user.user_id}`);
        setCartCount(res.data.cart_count || 0);
      } catch (err) {
        console.error("❌ Cart count fetch error:", err.message);
      }
    };

    fetchCartCount();

    // Optional: refresh every 15 seconds for live accuracy
    const interval = setInterval(fetchCartCount, 15000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ color, size }) => {
            let iconName;

            if (route.name === "Home") iconName = "home";
            else if (route.name === "Activity") iconName = "pulse";
            else if (route.name === "Cart") iconName = "cart";
            else if (route.name === "Account") iconName = "person";

            // 🛒 Add badge overlay for Cart
            if (route.name === "Cart") {
              return (
                <View style={{ position: "relative" }}>
                  <Ionicons name={iconName} size={size} color={color} />
                  {cartCount > 0 && (
                    <View
                      style={{
                        position: "absolute",
                        right: -10,
                        top: -5,
                        backgroundColor: "red",
                        borderRadius: 10,
                        minWidth: 18,
                        height: 18,
                        justifyContent: "center",
                        alignItems: "center",
                        paddingHorizontal: 3,
                      }}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: "bold",
                        }}
                      >
                        {cartCount}
                      </Text>
                    </View>
                  )}
                </View>
              );
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#2f95dc",
          tabBarInactiveTintColor: "gray",
          tabBarStyle: { paddingBottom: 5, height: 60 },
        })}
      >
        <Tabs.Screen name="Home" />
        <Tabs.Screen name="Activity" />
        <Tabs.Screen name="Cart" />
        <Tabs.Screen name="Account" />
      </Tabs>
    </>
  );
}
