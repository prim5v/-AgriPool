import React, { useEffect, useState, useCallback, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import ApiSocket from "../../ApiSocket";
import { AuthContext } from "../../../_Context/Auth.Context"; // ✅ adjust path if needed

const Cart = () => {
  const { user } = useContext(AuthContext); // ✅ grab logged-in user from context
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const userId = user?.user_id; // ✅ context-driven user_id

  const fetchCart = async () => {
    if (!userId) return; // Don’t fetch until we have the user
    try {
      setLoading(true);
      const res = await ApiSocket.get(`/api/cart/${userId}`);
      setCartItems(res.data || []);
    } catch (err) {
      console.error("❌ Fetch cart error:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [userId]); // ✅ refetch once user data is ready

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCart();
  }, [userId]);

  const toggleSelect = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const increment = async (item) => {
    try {
      const newQty = item.quantity + 1;
      await ApiSocket.put(`/api/cart/update/${item.cart_id}`, { quantity: newQty });
      setCartItems((prev) =>
        prev.map((x) =>
          x.cart_id === item.cart_id ? { ...x, quantity: newQty } : x
        )
      );
    } catch (err) {
      console.error("❌ Increment error:", err.message);
    }
  };

  const decrement = async (item) => {
    if (item.quantity <= 1) return;
    try {
      const newQty = item.quantity - 1;
      await ApiSocket.put(`/api/cart/update/${item.cart_id}`, { quantity: newQty });
      setCartItems((prev) =>
        prev.map((x) =>
          x.cart_id === item.cart_id ? { ...x, quantity: newQty } : x
        )
      );
    } catch (err) {
      console.error("❌ Decrement error:", err.message);
    }
  };

  const removeSelected = async () => {
    if (selectedItems.length === 0) return;
    Alert.alert(
      "Remove Items",
      `Remove ${selectedItems.length} item(s) from cart?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              for (const id of selectedItems) {
                await ApiSocket.delete(`/api/cart/delete/${id}`);
              }
              setCartItems((prev) =>
                prev.filter((x) => !selectedItems.includes(x.cart_id))
              );
              setSelectedItems([]);
            } catch (err) {
              console.error("❌ Remove error:", err.message);
            }
          },
        },
      ]
    );
  };

  const totalSelected = cartItems
    .filter((x) => selectedItems.includes(x.cart_id))
    .reduce(
      (sum, x) => sum + parseFloat(x.selling_price || x.price) * x.quantity,
      0
    );

  // ✅ Single product checkout handler
  const handleSingleCheckout = (item) => {
    if (!userId) {
      Alert.alert("Error", "You must be logged in to checkout.");
      return;
    }

    const selectedItem = [
      {
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        selling_price: item.selling_price || item.price,
        images: item.images,
      },
    ];

    const total = item.quantity * (item.selling_price || item.price);

    router.push({
      pathname: "/screens/Order",
      params: {
        checkoutData: JSON.stringify(selectedItem),
        total_price: String(total),
        user_id: userId,
      },
    });
  };

  // ✅ Multi-item checkout handler
  const handleCheckout = () => {
    if (!userId) {
      Alert.alert("Error", "You must be logged in to checkout.");
      return;
    }

    const selected = cartItems.filter((x) => selectedItems.includes(x.cart_id));
    if (selected.length === 0)
      return Alert.alert("Select at least one item to checkout");

    const total = selected.reduce(
      (sum, x) => sum + parseFloat(x.selling_price || x.price) * x.quantity,
      0
    );

    router.push({
      pathname: "/screens/Order",
      params: {
        checkoutData: JSON.stringify(selected),
        total_price: String(total),
        user_id: userId,
      },
    });
  };

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={{ color: "#2e7d32" }}>Loading cart...</Text>
      </View>
    );

  if (!userId)
    return (
      <View style={styles.centered}>
        <Text style={{ fontSize: 16, color: "#444" }}>
          Please log in to view your cart.
        </Text>
      </View>
    );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Cart ({cartItems.length})</Text>
        <TouchableOpacity onPress={() => setEditMode(!editMode)}>
          <Text style={styles.editText}>{editMode ? "Done" : "Edit"}</Text>
        </TouchableOpacity>
      </View>

      {/* CART ITEMS */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2e7d32"]}
          />
        }
      >
        {cartItems.map((item) => {
          const isSelected = selectedItems.includes(item.cart_id);
          const imgUri =
            item.images && item.images.length > 0
              ? item.images[0]
              : "https://via.placeholder.com/80";

          return (
            <View
              key={item.cart_id}
              style={[
                styles.card,
                isSelected && { borderColor: "#2f95dc", borderWidth: 2 },
              ]}
            >
              {/* Checkbox */}
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => toggleSelect(item.cart_id)}
              >
                <Ionicons
                  name={isSelected ? "checkbox" : "square-outline"}
                  size={24}
                  color={isSelected ? "#2f95dc" : "#999"}
                />
              </TouchableOpacity>

              {/* Image */}
              <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: "/screens/BuyerProductDetails",
                    params: { product_id: item.product_id },
                  })
                }
              >
                <Image source={{ uri: imgUri }} style={styles.image} />
              </TouchableOpacity>

              {/* Info */}
              <View style={styles.info}>
                <Text style={styles.name}>{item.product_name}</Text>
                <Text style={styles.price}>
                  KSh {item.selling_price || item.price}
                </Text>

                {/* Quantity controls */}
                <View style={styles.qtyContainer}>
                  <TouchableOpacity onPress={() => decrement(item)}>
                    <Ionicons name="remove-circle" size={26} color="#2f95dc" />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => increment(item)}>
                    <Ionicons name="add-circle" size={26} color="#2f95dc" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* FOOTER */}
      {(selectedItems.length > 0 || editMode) && (
        <View style={styles.footer}>
          {editMode && selectedItems.length > 0 && (
            <TouchableOpacity style={styles.removeBtn} onPress={removeSelected}>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          )}

          <View style={styles.totalBox}>
            <Text style={styles.totalText}>Total: KSh {totalSelected}</Text>
          </View>

          {selectedItems.length > 0 && (
            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={handleCheckout}
            >
              <Text style={styles.checkoutText}>Checkout</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

export default Cart;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: { fontSize: 20, fontWeight: "700", color: "#222" },
  editText: { fontSize: 16, color: "#2f95dc", fontWeight: "600" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafafa",
    marginHorizontal: 10,
    marginVertical: 6,
    borderRadius: 10,
    padding: 10,
    elevation: 2,
  },
  checkbox: { marginRight: 8 },
  image: { width: 80, height: 80, borderRadius: 8, marginRight: 10 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "600", color: "#333" },
  price: { color: "#2e7d32", marginVertical: 4 },
  qtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 5,
    gap: 10,
  },
  qtyText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    minWidth: 30,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    backgroundColor: "#fff",
  },
  removeBtn: {
    backgroundColor: "#d32f2f",
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  removeText: { color: "#fff", fontWeight: "600" },
  totalBox: { flex: 1 },
  totalText: { fontWeight: "700", fontSize: 16, color: "#333" },
  checkoutBtn: {
    backgroundColor: "#2e7d32",
    padding: 10,
    borderRadius: 8,
    paddingHorizontal: 15,
  },
  checkoutText: { color: "#fff", fontWeight: "700" },
});
