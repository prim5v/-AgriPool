// app/Farmer/(tabs)/Home.jsx
import React from "react";
import { SafeAreaView, View, StyleSheet } from "react-native";
import ProfileOverview from "../../components/ProfileOverview";

export default function Home() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Profile Overview */}
        <ProfileOverview />

        {/* Rest of your home content */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    padding: 16,
  },
});
