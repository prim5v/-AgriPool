import React, { useEffect, useState, useRef, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Alert,
  Animated,
  Easing,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import ApiSocket from "../ApiSocket";
import { AuthContext } from "../../_Context/Auth.Context";

const { width, height } = Dimensions.get("window");

const BuyerProductDetails = () => {
  const { product_id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [cartCount, setCartCount] = useState(0);
  const [liveCartCount, setLiveCartCount] = useState(0); // For smooth number animation

  const scrollRef = useRef(null);
  const cartIconRef = useRef(null);
  const addCartBtnRef = useRef(null);

  // --- Animation refs ---
  const animValue = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const animScale = useRef(new Animated.Value(1)).current;
  const animOpacity = useRef(new Animated.Value(0)).current;

  // --- Fetch product details ---
  useEffect(() => {
    if (!product_id) return;
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const res = await ApiSocket.get(`/get-product-details/${product_id}`);
        const fetchedProduct = res.data;
        setProduct(fetchedProduct);
        setQuantity(fetchedProduct.stock > 0 ? 1 : 0);
      } catch (err) {
        console.error("❌ Product fetch error:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [product_id]);

  // --- Auto scroll images ---
  useEffect(() => {
    if (!product?.images || product.images.length <= 1) return;
    const interval = setInterval(() => {
      const next = (currentImage + 1) % product.images.length;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setCurrentImage(next);
    }, 4000);
    return () => clearInterval(interval);
  }, [currentImage, product?.images]);

  // --- Fetch related products ---
  useEffect(() => {
    if (!product_id) return;
    const fetchRelated = async () => {
      try {
        const res = await ApiSocket.get(`/get-related-products`, { params: { product_id } });
        setRelated(res.data.products || []);
      } catch (err) {
        console.error("❌ Related products fetch error:", err.message);
      }
    };
    fetchRelated();
  }, [product_id]);

  // --- Fetch cart count ---
  useEffect(() => {
    if (!user?.user_id) return;
    const fetchCartCount = async () => {
      try {
        const res = await ApiSocket.get(`/api/cart/count/${user.user_id}`);
        setCartCount(res.data.cart_count);
        setLiveCartCount(res.data.cart_count);
      } catch (err) {
        console.error("❌ Cart count fetch error:", err.message);
      }
    };
    fetchCartCount();
  }, [user]);

  const incrementQty = (step = 1) => {
    if (!product) return;
    setQuantity(Math.min(quantity + step, product.stock));
  };

  const decrementQty = (step = 1) => {
    setQuantity(Math.max(quantity - step, 1));
  };

  // --- Smooth badge number animation ---
  const animateBadgeNumber = (start, end) => {
    const duration = 700;
    const steps = 20;
    const stepTime = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const newValue = Math.round(start + ((end - start) * currentStep) / steps);
      setLiveCartCount(newValue);
      if (currentStep >= steps) clearInterval(interval);
    }, stepTime);
  };

  // --- Animation from Add to Cart button to Cart Icon ---
  const runAddToCartAnimation = () => {
    if (!addCartBtnRef.current || !cartIconRef.current) return;

    addCartBtnRef.current.measure((bx, by, bw, bh, bAbsX, bAbsY) => {
      cartIconRef.current.measure((cx, cy, cw, ch, cAbsX, cAbsY) => {
        animValue.setValue({ x: bAbsX, y: bAbsY });
        animScale.setValue(1);
        animOpacity.setValue(1);

        const startCount = cartCount;
        const endCount = cartCount + quantity;

        // Run badge number animation
        animateBadgeNumber(startCount, endCount);

        Animated.parallel([
          Animated.timing(animValue, {
            toValue: { x: cAbsX, y: cAbsY },
            duration: 700,
            easing: Easing.in(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(animScale, {
            toValue: 0.1,
            duration: 700,
            easing: Easing.in(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(animOpacity, {
            toValue: 0,
            duration: 700,
            useNativeDriver: false,
          }),
        ]).start(() => {
          setCartCount(endCount);
        });
      });
    });
  };

  const handleAddToCart = async () => {
    if (!product) return;
    if (!user?.user_id) {
      Alert.alert("Login Required", "Please log in to add items to your cart.");
      router.push("/screens/Login");
      return;
    }

    try {
      const payload = {
        user_id: user.user_id,
        product_id: product.product_id,
        name: product.product_name || product.name,
        price: product.selling_price || product.price,
        quantity,
      };

      const res = await ApiSocket.post("/api/cart/add", payload);
      if (res.status === 201) runAddToCartAnimation();
      else Alert.alert("⚠️ Failed", "Could not add item to cart.");
    } catch (err) {
      console.error("❌ Add to cart error:", err.message);
      Alert.alert("Server Error", "An error occurred while adding to cart.");
    }
  };

  const handleMakeOrder = () => {
    if (!user?.user_id) {
      Alert.alert("Login Required", "Please log in to place an order.");
      router.push("/screens/Login");
      return;
    }
    router.push({
      pathname: "/screens/Order",
      params: { product_id: product.product_id, quantity },
    });
  };

  const handleRelatedPress = (id) => {
    router.push({
      pathname: "/screens/BuyerProductDetails",
      params: { product_id: id },
    });
  };

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={{ color: "#2e7d32", marginTop: 10 }}>Loading product...</Text>
      </View>
    );

  if (!product)
    return (
      <View style={styles.centered}>
        <Text style={{ color: "#555" }}>No product found.</Text>
      </View>
    );

  const images =
    Array.isArray(product.images) && product.images.length
      ? product.images
      : [product.image_url || "https://via.placeholder.com/400x300?text=No+Image"];

  const unit = product.unit || "";
  const singlePrice = product.selling_price || product.price;
  const totalPrice = singlePrice * quantity;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Image Carousel */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.imageCarousel}
        >
          {images.map((img, i) => (
            <View key={i} style={{ width, height: height * 0.35 }}>
              <Image source={{ uri: img }} style={styles.image} />
              <View style={styles.imageCountBadge}>
                <Text style={styles.imageCountText}>
                  {i + 1}/{images.length}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Floating Cart Icon */}
        <TouchableOpacity
  ref={cartIconRef}
  style={styles.cartIconFloating}
  activeOpacity={0.7}
  onPress={() => router.push("/Buyer/(tabs)/Cart")}
>
  <Text style={{ fontSize: 24 }}>🛒</Text>
  <View style={styles.cartBadge}>
    <Text style={styles.cartBadgeText}>{liveCartCount}</Text>
  </View>
</TouchableOpacity>


        {/* Animated flying image */}
        <Animated.Image
          source={{ uri: images[currentImage] }}
          style={{
            width: 50,
            height: 50,
            position: "absolute",
            left: animValue.x,
            top: animValue.y,
            transform: [{ scale: animScale }],
            opacity: animOpacity,
            borderRadius: 8,
          }}
        />

        {/* Product Details */}
        <View style={styles.details}>
          <Text style={styles.title}>{product.product_name}</Text>

          <View style={styles.priceQuantityRow}>
            <Text style={styles.price}>{`KSh ${singlePrice}/${unit}`}</Text>
            {product.stock === 0 ? (
              <Text style={styles.outOfStock}>Out of stock</Text>
            ) : (
              <View style={styles.bulkQuantityControls}>
                <View style={styles.bulkButtonsRow}>
                  {[1, 10, 100, 1000].map((step) => (
                    <TouchableOpacity key={`dec-${step}`} style={styles.bulkBtn} onPress={() => decrementQty(step)}>
                      <Text style={styles.qtyText}>-{step}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.qtyCount}>{quantity}</Text>
                <View style={styles.bulkButtonsRow}>
                  {[1, 10, 100, 1000].map((step) => (
                    <TouchableOpacity key={`inc-${step}`} style={styles.bulkBtn} onPress={() => incrementQty(step)}>
                      <Text style={styles.qtyText}>+{step}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {product.stock > 0 && <Text style={{ marginBottom: 10, color: "#555" }}>{product.stock} {unit} in stock</Text>}

          <Text style={styles.sectionTitle}>Product Description</Text>
          <Text style={styles.description}>{product.description || "No description available."}</Text>

          {related.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Related Products</Text>
              <FlatList
                data={related}
                keyExtractor={(item) => item.product_id}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ paddingVertical: 10 }}
                ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
                renderItem={({ item }) => {
                  const img = item.images?.[0] || item.image_url || "https://via.placeholder.com/150x150?text=No+Image";
                  return (
                    <TouchableOpacity onPress={() => handleRelatedPress(item.product_id)} style={styles.relatedCard}>
                      <Image source={{ uri: img }} style={styles.relatedImage} />
                      <Text numberOfLines={1} style={styles.relatedName}>{item.product_name}</Text>
                      <Text style={styles.relatedPrice}>KSh {item.selling_price || item.price}</Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </>
          )}

          <View style={styles.footerLine} />
          <Text style={styles.footerText}>End of content</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>← Back to Products</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Floating Bar */}
      <View style={styles.bottomBar}>
        <Text style={styles.totalPrice}>Total: KSh {totalPrice}</Text>
        <View style={styles.rightButtons}>
          <TouchableOpacity style={styles.orderButtonFloating} onPress={handleMakeOrder}>
            <Text style={styles.orderButtonTextFloating}>📦 Order</Text>
          </TouchableOpacity>
          <TouchableOpacity ref={addCartBtnRef} style={styles.cartButtonFloating} onPress={handleAddToCart}>
            <Text style={styles.cartButtonTextFloating}>🛒 Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 50 },
  imageCarousel: { width, height: height * 0.35, backgroundColor: "#f6f6f6" },
  image: { width, height: height * 0.35, resizeMode: "cover" },
  imageCountBadge: { position: "absolute", top: 10, left: 10, backgroundColor: "rgba(27,94,32,0.8)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  imageCountText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  cartIconFloating: { position: "absolute", top: 15, right: 15, width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", elevation: 5 },
  cartBadge: { position: "absolute", top: -4, right: -4, backgroundColor: "red", width: 18, height: 18, borderRadius: 9, justifyContent: "center", alignItems: "center" },
  cartBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  details: { padding: 16 },
  title: { fontSize: 22, fontWeight: "800", color: "#1b5e20", marginBottom: 6 },
  priceQuantityRow: { flexDirection: "column", marginBottom: 8 },
  price: { fontSize: 18, fontWeight: "700", color: "#2e7d32" },
  outOfStock: { color: "red", fontWeight: "700" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1b5e20", marginBottom: 8, marginTop: 10 },
  description: { fontSize: 14, color: "#555", lineHeight: 20, marginBottom: 20 },
  relatedCard: { width: 120, borderRadius: 12, backgroundColor: "#f8f8f8", padding: 8, alignItems: "center", elevation: 2 },
  relatedImage: { width: 80, height: 80, borderRadius: 8, resizeMode: "cover", marginBottom: 6 },
  relatedName: { fontSize: 12, fontWeight: "600", color: "#333" },
  relatedPrice: { fontSize: 12, fontWeight: "700", color: "#1b5e20" },
  footerLine: { height: 1, backgroundColor: "#ccc", marginVertical: 15 },
  footerText: { textAlign: "center", color: "#777", fontSize: 13, marginBottom: 20 },
  backButton: { marginTop: 10, paddingVertical: 8, alignSelf: "flex-start" },
  backText: { color: "#2e7d32", fontSize: 15, fontWeight: "600" },
  bulkQuantityControls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 5 },
  bulkButtonsRow: { flexDirection: "row" },
  bulkBtn: { backgroundColor: "#ddd", marginHorizontal: 2, paddingVertical: 4, paddingHorizontal: 6, borderRadius: 5 },
  qtyText: { fontSize: 14, fontWeight: "700" },
  qtyCount: { fontSize: 18, fontWeight: "700", marginHorizontal: 10 },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", padding: 10, backgroundColor: "#fff", borderTopWidth: 1, borderColor: "#ccc", elevation: 10, justifyContent: "space-between", alignItems: "center" },
  totalPrice: { fontSize: 16, fontWeight: "700" },
  rightButtons: { flexDirection: "row" },
  orderButtonFloating: { backgroundColor: "#1b5e20", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 12, marginRight: 5, alignItems: "center" },
  orderButtonTextFloating: { color: "#fff", fontWeight: "700" },
  cartButtonFloating: { backgroundColor: "#43a047", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 12, marginLeft: 5, alignItems: "center" },
  cartButtonTextFloating: { color: "#fff", fontWeight: "700" },
});

export default BuyerProductDetails;
