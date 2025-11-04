// app/components/ButtonComponent.jsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, FlatList, Dimensions } from "react-native";
const { width } = Dimensions.get("window");

const BUTTONS = [
  { id: "book", title: "Book transport", image: require("../../assets/images/book-transport.jpg"), route: "screens/BookTransport" },
  { id: "sell", title: "Sell produce", image: require("../../assets/images/bg.jpg"), route: "screens/upload" },
  { id: "track", title: "Track my produce", image: require("../../assets/images/location.jpg"), route: "TrackProduce" },
  { id: "payments", title: "Payments & Earnings", image: require("../../assets/images/payments.jpg"), route: "Payments" },
];

const ButtonComponent = ({ navigation }) => {
  return (
    <FlatList
      horizontal
      data={BUTTONS}
      keyExtractor={(i) => i.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => navigation?.navigate?.(item.route)}>
          <ImageBackground source={item.image} style={styles.bg} imageStyle={{ borderRadius: 12 }}>
            <View style={styles.overlay}>
              <Text style={styles.title}>{item.title}</Text>
            </View>
          </ImageBackground>
        </TouchableOpacity>
      )}
    />
  );
};

const styles = StyleSheet.create({
  card: {
    width: Math.round(width * 0.6),
    height: 110,
    marginRight: 12,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "#e0e0e0",
  },
  bg: { flex: 1, justifyContent: "flex-end" },
  overlay: {
    backgroundColor: "rgba(0,0,0,0.28)",
    padding: 10,
  },
  title: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
});

export default ButtonComponent;
