// app/components/GetProducts.jsx
import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import ApiSocket from "../ApiSocket";
import { InfoContext } from "../../_Context/InfoContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width * 0.6; // how wide each card is
const CARD_HEIGHT = height / 3; // fixed height for product section

const GetProducts = () => {
  const { user } = useContext(InfoContext) || {};
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const storedUser = user || JSON.parse(await AsyncStorage.getItem("user"));
        const userId = storedUser?.user_id;

        if (!userId) {
          setError("No user ID found.");
          setLoading(false);
          return;
        }

        const response = await ApiSocket.get(`/get-products/${userId}`);
        setProducts(response.data.products || []);
      } catch (err) {
        console.error("❌ GetProducts error:", err);
        setError("Failed to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [user]);

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={{ color: "#2e7d32", marginTop: 10 }}>Loading products...</Text>
      </View>
    );

  if (error)
    return (
      <View style={styles.centered}>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    );

  if (products.length === 0)
    return (
      <View style={styles.centered}>
        <Text style={{ color: "#555" }}>No products yet. Upload some to see them here.</Text>
      </View>
    );

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Your Products</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollRow}
      >
        {products.map((p) => (
          <TouchableOpacity
            key={p.product_id}
            activeOpacity={0.8}
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/screens/ProductDetails",
                params: { productId: p.product_id },
              })
            }
          >
            <Image
              source={{ uri: p.images?.[0] }}
              style={styles.image}
              resizeMode="cover"
            />
            <View style={styles.info}>
              <Text style={styles.title} numberOfLines={1}>
                {p.product_name}
              </Text>
              <Text style={styles.price}>KSh {p.price}</Text>
              <Text style={styles.stock}>
                {p.stock} {p.unit}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    height: CARD_HEIGHT,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1b5e20",
    marginLeft: 16,
    marginBottom: 8,
  },
  scrollRow: {
    paddingHorizontal: 12,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT * 0.85,
    backgroundColor: "#fff",
    marginRight: 12,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
  },
  image: {
    width: "100%",
    height: "65%",
  },
  info: {
    padding: 10,
    justifyContent: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2e7d32",
  },
  price: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1b5e20",
    marginTop: 2,
  },
  stock: {
    fontSize: 12,
    color: "#555",
    marginTop: 2,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    height: CARD_HEIGHT,
  },
});

export default GetProducts;
