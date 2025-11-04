// app/components/ProductCard.jsx
import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const ProductCard = ({ item }) => {
  const router = useRouter();

  // Format unit properly (remove plural)
  const formatUnit = (unit) => {
    if (!unit) return "";
    const u = unit.toLowerCase();
    if (u.endsWith("s")) return u.slice(0, -1);
    return u;
  };

  // Render star rating visually
  const renderStars = (ratingValue) => {
    const filledStars = Math.round(ratingValue || 0);
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Ionicons
            key={i}
            name={i <= filledStars ? "star" : "star-outline"}
            size={14}
            color="#FFD700"
          />
        ))}
      </View>
    );
  };

  const handleSelectProduct = () => {
    router.push({
      pathname: "/screens/BuyerProductDetails",
      params: { product_id: item.product_id },
    });
  };

  const unitText = formatUnit(item.unit);
  const displayPrice = item.selling_price || item.price || 0;
  const formattedPrice = `Ksh ${displayPrice}/${unitText}`;
  const ratingValue =
    typeof item.rating === "number" && !isNaN(item.rating) ? item.rating : 0;

  return (
    <TouchableOpacity style={styles.card} onPress={handleSelectProduct}>
      <Image
        source={{
          uri:
            item.images?.[0] ||
            "https://via.placeholder.com/150x150.png?text=No+Image",
        }}
        style={styles.image}
      />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.product_name}
        </Text>
        <Text style={styles.price}>{formattedPrice}</Text>
        {renderStars(ratingValue)}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    padding: 10,
    alignItems: "flex-start",
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 130,
    borderRadius: 8,
    resizeMode: "cover",
  },
  info: { marginTop: 8, alignItems: "flex-start", width: "100%" },
  name: { fontSize: 14, fontWeight: "600", color: "#1b5e20" },
  price: { fontSize: 14, color: "#2e7d32", fontWeight: "700", marginTop: 4 },
  starsRow: { flexDirection: "row", marginTop: 4 },
});

export default ProductCard;
