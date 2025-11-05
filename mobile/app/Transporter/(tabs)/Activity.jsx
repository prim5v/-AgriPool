import React from "react";
import { View, StyleSheet } from "react-native";
import TransportActivityList from "../../components/TransportActivityList";
import AcceptRejectBookings from "../../components/AcceptRejectBookings";

const ActivityScreen = () => {
  return (
    <View style={styles.container}>
      <TransportActivityList />
      <AcceptRejectBookings /> {/* silently polls and shows when needed */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
});

export default ActivityScreen;
