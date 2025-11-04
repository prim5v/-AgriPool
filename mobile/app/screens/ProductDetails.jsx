// app/screens/ProductDetails.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import ApiSocket from "../ApiSocket";

const { width, height } = Dimensions.get("window");

const ProductDetails = () => {
  const { productId } = useLocalSearchParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentImage, setCurrentImage] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!productId) {
      setError("No product ID provided.");
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await ApiSocket.get(`/get-product-details/${productId}`);
        setProduct(response.data);
      } catch (err) {
        console.error("❌ ProductDetails fetch error:", err);
        setError("Failed to fetch product details.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Auto-scroll carousel
  useEffect(() => {
    if (!product?.images || product.images.length <= 1) return;

    const interval = setInterval(() => {
      const nextIndex = (currentImage + 1) % product.images.length;
      scrollRef.current.scrollTo({ x: nextIndex * width, animated: true });
      setCurrentImage(nextIndex);
    }, 4000);

    return () => clearInterval(interval);
  }, [currentImage, product?.images]);

  const handleScroll = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentImage(index);
  };

  const goToOrder = (orderId) => {
    router.push(`/OrderDetails?orderId=${orderId}`);
  };

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={{ color: "#2e7d32", marginTop: 10 }}>Loading product...</Text>
      </View>
    );

  if (error)
    return (
      <View style={styles.centered}>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    );

  if (!product)
    return (
      <View style={styles.centered}>
        <Text style={{ color: "#555" }}>No product found.</Text>
      </View>
    );

  return (
    <ScrollView style={styles.container}>
      {/* Image carousel */}
      <View>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.imageCarousel}
        >
          {product.images && product.images.length > 0 ? (
            product.images.map((img, i) => (
              <Image key={i} source={{ uri: img }} style={styles.image} />
            ))
          ) : (
            <Image
              source={{ uri: "https://via.placeholder.com/400x300?text=No+Image" }}
              style={styles.image}
            />
          )}
        </ScrollView>
        {product.images && product.images.length > 1 && (
          <View style={styles.imageIndicator}>
            <Text style={styles.imageIndicatorText}>
              {currentImage + 1}/{product.images.length}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.details}>
        <Text style={styles.title}>{product.product_name}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>KSh {product.price}</Text>
          {product.selling_price && (
            <Text style={styles.oldPrice}>KSh {product.selling_price}</Text>
          )}
        </View>

        <Text style={styles.stock}>
          {product.stock} {product.unit} available
        </Text>
        <Text style={styles.date}>
          Posted on {new Date(product.created_at).toLocaleDateString()}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.descHeader}>Product Description</Text>
        <Text style={styles.description}>
          {product.description || "No description available."}
        </Text>

        {/* Orders Section */}
        <View style={styles.divider} />
        <Text style={styles.descHeader}>Orders</Text>
        {product.orders && product.orders.length > 0 ? (
          product.orders.map((order, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.orderCard}
             onPress={() => router.push(`/screens/OrderDetails?orderId=${order.order_id}`)}
            >
              <Text style={styles.orderText}>Order ID: {order.order_id}</Text>
              <Text style={styles.orderText}>
                Quantity: {order.quantity} {order.unit}
              </Text>
              <Text style={styles.orderText}>Total Price: KSh {order.total_price}</Text>
              <Text style={styles.orderText}>Status: {order.status}</Text>
              <Text style={styles.orderText}>
                Buyer: {order.buyer?.name || "N/A"} ({order.buyer?.phone || "No phone"})
              </Text>
              <Text style={styles.orderDate}>
                Ordered on {new Date(order.created_at).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={{ fontSize: 14, color: "#555", fontStyle: "italic" }}>
            No orders yet.
          </Text>
        )}

        <View style={styles.divider} />

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back to Products</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 50 },
  imageCarousel: { width, height: height * 0.35, backgroundColor: "#f6f6f6" },
  image: { width, height: height * 0.35, resizeMode: "cover" },
  imageIndicator: {
    position: "absolute",
    bottom: 10,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  imageIndicatorText: { color: "#fff", fontSize: 12 },
  details: { padding: 16 },
  title: { fontSize: 22, fontWeight: "800", color: "#1b5e20" },
  priceRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  price: { fontSize: 18, fontWeight: "700", color: "#2e7d32" },
  oldPrice: { fontSize: 14, color: "#888", textDecorationLine: "line-through", marginLeft: 8 },
  stock: { fontSize: 14, color: "#333", marginTop: 2 },
  date: { fontSize: 12, color: "#777", marginTop: 4 },
  divider: { height: 1, backgroundColor: "#e0e0e0", marginVertical: 12 },
  descHeader: { fontSize: 16, fontWeight: "700", color: "#1b5e20", marginBottom: 6 },
  description: { fontSize: 14, color: "#555", lineHeight: 20 },
  backButton: { marginTop: 20, paddingVertical: 10, alignSelf: "flex-start" },
  backText: { color: "#2e7d32", fontSize: 15, fontWeight: "600" },

  // Orders styling
  orderCard: {
    borderWidth: 1,
    borderColor: "#c0c0c0",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#f9f9f9",
  },
  orderText: { fontSize: 14, color: "#333", marginBottom: 2 },
  orderDate: { fontSize: 12, color: "#555", marginTop: 2 },
});

export default ProductDetails;
