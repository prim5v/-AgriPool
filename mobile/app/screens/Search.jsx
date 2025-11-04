// app/screens/Search.jsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ApiSocket from "../ApiSocket";
import ProductCard from "../components/ProductCard";
import MapCard from "../components/MapCard";

const Search = () => {
  const { q } = useLocalSearchParams();
  const [query, setQuery] = useState(q || "");
  const router = useRouter();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    loadRecentSearches();
    if (q) fetchResults(q);
  }, [q]);

  const loadRecentSearches = async () => {
    const saved = await AsyncStorage.getItem("recent_searches");
    if (saved) setRecentSearches(JSON.parse(saved));
  };

  const saveRecentSearch = async (term) => {
    if (!term.trim()) return;
    let updated = [term, ...recentSearches.filter((t) => t !== term)].slice(0, 5);
    setRecentSearches(updated);
    await AsyncStorage.setItem("recent_searches", JSON.stringify(updated));
  };

  const fetchResults = async (searchQuery = query) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const userData = await AsyncStorage.getItem("user");
      const userId = userData ? JSON.parse(userData).user_id : null;

      const res = await ApiSocket.get("/search", {
        params: { q: searchQuery, user_id: userId },
        headers: { Authorization: `Bearer ${token}` },
      });

      setResults(res.data);
      await saveRecentSearch(searchQuery);
    } catch (err) {
      console.log("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#777" style={{ marginHorizontal: 5 }} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search..."
            returnKeyType="search"
            onSubmitEditing={() => fetchResults(query)}
            style={styles.input}
          />
        </View>
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2e7d32" />
          <Text>Searching for "{query}"...</Text>
        </View>
      )}

      {/* Recent Searches */}
      {!loading && !results && recentSearches.length > 0 && (
        <ScrollView contentContainerStyle={styles.recentContainer}>
          <Text style={styles.sectionTitle}>Recent Searches</Text>
          {recentSearches.map((term, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.recentItem}
              onPress={() => fetchResults(term)}
            >
              <Ionicons name="time-outline" size={18} color="#555" />
              <Text style={styles.recentText}>{term}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Results */}
      {!loading && results && (
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          {results.products?.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Products</Text>
              <FlatList
                data={results.products}
                keyExtractor={(item) => item.product_id.toString()}
                renderItem={({ item }) => <ProductCard item={item} />}
                numColumns={2}
                scrollEnabled={false}
                columnWrapperStyle={{
                  justifyContent: "space-between",
                  paddingHorizontal: 10,
                }}
              />
            </>
          )}

          {results.transport_services?.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Transport Services</Text>
              {results.transport_services.map((service) => (
                <MapCard key={service.service_id} service={service} />
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2e7d32",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  backButton: { marginRight: 8 },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 8,
    height: 40,
  },
  input: { flex: 1, fontSize: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2e7d32",
    marginVertical: 10,
    marginLeft: 12,
  },
  recentContainer: { paddingHorizontal: 15, paddingTop: 10 },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    marginBottom: 8,
    borderRadius: 10,
    elevation: 1,
  },
  recentText: { marginLeft: 8, fontSize: 15, color: "#333" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});

export default Search;
