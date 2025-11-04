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
  Dimensions,
} from "react-native";
import { InfoProvider } from "../../../_Context/InfoContext";
import Carousel from "../../components/Carousel";
import Collections from "../../components/Collections";
import PopularProducts from "../../components/PopularProducts";
import Hero from "../../components/Hero";
import ProductCard from "../../components/ProductCard";
import ApiSocket from "../../ApiSocket";

const screenWidth = Dimensions.get("window").width;

const HomeContent = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [popular, setPopular] = useState([]);
  const [page, setPage] = useState(1);

  const productsRef = useRef(null);
  const scrollViewRef = useRef();

  // Fetch products from API
  const fetchProducts = async (refresh = false) => {
    try {
      if (refresh) setPage(1);
      setLoading(true);

      const res = await ApiSocket.get(`/products?page=${refresh ? 1 : page}`);
      const { all_products = [], popular_products = [] } = res.data || {};

      setPopular(popular_products);
      if (refresh) setProducts(all_products);
      else setProducts((prev) => [...prev, ...all_products]);
    } catch (error) {
      console.error("Error fetching products:", error.message);
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

  // Scroll to Products section
const scrollToProducts = () => {
  if (!scrollViewRef.current) return;

  scrollViewRef.current.scrollTo({ y: 1000, animated: true }); // 500 is the fixed scroll position
};


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7fff7" }}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#0077b6"]}
            tintColor="#0077b6"
          />
        }
      >
        <Hero />
        <Carousel width={screenWidth} />

        {/* Collections with auto-scroll */}
        <Collections onScrollToProducts={scrollToProducts} />

        {/* Popular Products Section */}
        <PopularProducts ref={productsRef} products={popular} />

        {/* All Products Grid */}
        <View style={{ paddingHorizontal: 12, marginTop: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#1b5e20", marginBottom: 10 }}>
            All Products
          </Text>

          {loading && products.length === 0 ? (
            <ActivityIndicator size="large" color="#1b5e20" style={{ marginTop: 30 }} />
          ) : (
            <FlatList
              data={products}
              numColumns={2}
              keyExtractor={(item) => item.product_id.toString()}
              columnWrapperStyle={{ justifyContent: "space-between" }}
              renderItem={({ item }) => <ProductCard item={item} />}
              scrollEnabled={false} // disable FlatList scrolling to allow ScrollView
              ListFooterComponent={() =>
                loading ? <ActivityIndicator size="small" color="#1b5e20" style={{ marginVertical: 20 }} /> : null
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

const Home = (props) => (
  <InfoProvider>
    <HomeContent {...props} />
  </InfoProvider>
);

export default Home;
