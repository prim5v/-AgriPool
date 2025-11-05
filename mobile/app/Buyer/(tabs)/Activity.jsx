import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  RefreshControl,
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
} from "react-native";
import OrderOverview from "../../components/OrderOverview";
import ProductCard from "../../components/ProductCard";
import ApiSocket from "../../ApiSocket";

const Activity = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);

  const scrollViewRef = useRef();

  const fetchProducts = async (refresh = false) => {
    try {
      if (refresh) setPage(1);
      setLoading(true);

      const res = await ApiSocket.get(`/products?page=${refresh ? 1 : page}`);
      const { all_products = [] } = res.data || {};

      if (refresh) setProducts(all_products);
      else setProducts((prev) => [...prev, ...all_products]);
    } catch (error) {
      console.error("❌ Error fetching products:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts(true);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts(true);
  }, []);

  const loadMore = () => {
    if (!loading) setPage((prev) => prev + 1);
  };

  useEffect(() => {
    if (page > 1) fetchProducts();
  }, [page]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#1b5e20"]}
            tintColor="#1b5e20"
          />
        }
      >
        {/* Header */}
        <Text style={styles.header}>My Orders</Text>
        <OrderOverview />

        {/* All Products */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Products you may like</Text>

          {loading && products.length === 0 ? (
            <ActivityIndicator size="large" color="#1b5e20" style={{ marginTop: 30 }} />
          ) : (
            <FlatList
              data={products}
              numColumns={2}
              keyExtractor={(item) => item.product_id.toString()}
              columnWrapperStyle={{ justifyContent: "space-between" }}
              renderItem={({ item }) => <ProductCard item={item} />}
              scrollEnabled={false} // ScrollView handles scroll
              ListFooterComponent={() =>
                loading ? (
                  <ActivityIndicator size="small" color="#1b5e20" style={{ marginVertical: 20 }} />
                ) : null
              }
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1b5e20",
    marginBottom: 10,
    paddingHorizontal: 12,
  },
  sectionContainer: { paddingHorizontal: 12, marginTop: 20 , paddingTop: 450 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1b5e20",
    marginBottom: 10,
  },
});

export default Activity;
