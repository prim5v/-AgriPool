import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Home from "./Home";
import Account from "./Account";
import Activity from "./Activity";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "react-native";

const Tab = createBottomTabNavigator();

export default function TabLayout() {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ color, size }) => {
            let iconName;

            if (route.name === "Home") iconName = "home";
            else if (route.name === "Activity") iconName = "pulse";
            else if (route.name === "History") iconName = "time";

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#2f95dc",
          tabBarInactiveTintColor: "gray",
          tabBarStyle: { paddingBottom: 5, height: 60 },
        })}
      >
        <Tab.Screen name="Home" component={Home} />
        <Tab.Screen name="Activity" component={Activity} />
        <Tab.Screen name="Account" component={Account} />
      </Tab.Navigator>
    </>
  );
}
