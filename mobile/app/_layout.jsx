import { Stack } from "expo-router";
import { AuthProvider } from "../_Context/Auth.Context";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Platform, StatusBar, StyleSheet } from "react-native";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SafeAreaView style={styles.safeArea}>
          <Stack screenOptions={{ headerShown: false }}>
            {/* Default landing */}
            <Stack.Screen name="index" />

            {/* Authentication */}
            <Stack.Screen name="Auth/Login" />
            <Stack.Screen name="Auth/Signup" />
            <Stack.Screen name="Auth/VerifyOtp" />

            {/* Farmer Dashboard */}
            <Stack.Screen name="Farmer/(tabs)/Home" />
            <Stack.Screen name="Farmer/(tabs)/Activity" />
            <Stack.Screen name="Farmer/(tabs)/Account" />

            {/* Buyer Dashboard */}
            <Stack.Screen name="Buyer/(tabs)/Home" />
            <Stack.Screen name="Buyer/(tabs)/Activity" />
            <Stack.Screen name="Buyer/(tabs)/Account" />

            {/* Transporter Dashboard */}
            <Stack.Screen name="Transporter/(tabs)/Home" />
            <Stack.Screen name="Transporter/(tabs)/Activity" />
            <Stack.Screen name="Transporter/(tabs)/Account" />
          </Stack>
        </SafeAreaView>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
});
