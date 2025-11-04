// app/components/PopularProducts.jsx
import React from "react";
import { View, Text, FlatList, Image, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");
const CARD_MARGIN = 8;
const NUM_COLUMNS = 3;
const CARD_WIDTH = (width - 60 - CARD_MARGIN * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const CARD_HEIGHT = 120; // compact cards

const PopularProducts = ({ products = [] }) => {
  const router = useRouter();

  if (!products.length) return null;

  const handleSelectProduct = (product_id) => {
    router.push({
      pathname: "/screens/BuyerProductDetails",
      params: { product_id },
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleSelectProduct(item.product_id)}
    >
      <Image
        source={{
          uri:
            item.images?.[0] ||
            "https://via.placeholder.com/150x150.png?text=No+Image",
        }}
        style={styles.image}
      />
      <Text style={styles.name} numberOfLines={1}>
        {item.product_name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.outerRing}>
      <Text style={styles.title}>Popular Products</Text>
      <FlatList
        data={products.slice(0, 9)} // 3x3 grid
        keyExtractor={(item) => item.product_id.toString()}
        renderItem={renderItem}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={{ justifyContent: "space-between", marginBottom: CARD_MARGIN }}
        scrollEnabled={false}
        key={`flatlist-${NUM_COLUMNS}`} // force remount if NUM_COLUMNS changes
      />
    </View>
  );
};

const styles = StyleSheet.create({
  outerRing: {
    padding: 15,
    margin: 15,
    borderWidth: 2,
    borderColor: "#1b5e20",
    borderRadius: 20,
    backgroundColor: "#fff",
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1b5e20",
    marginBottom: 10,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 6,
    alignItems: "center",
    justifyContent: "flex-start",
    borderWidth: 1,
    borderColor: "#1b5e20",
  },
  image: {
    width: "100%",
    height: CARD_HEIGHT * 0.7, // slightly taller to give more image space
    borderRadius: 8,
    resizeMode: "cover",
  },
  name: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1b5e20",
    marginTop: 4,
    textAlign: "center",
  },
});

export default PopularProducts;
