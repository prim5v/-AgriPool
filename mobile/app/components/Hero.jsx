// app/components/Hero.jsx
import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  Dimensions,
  TextInput,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { InfoContext } from "../../_Context/InfoContext";
import { useRouter } from "expo-router";

const { height: H } = Dimensions.get("window");
const HERO_HEIGHT = Math.round(H / 3);

const timeGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

const Hero = ({ profileImage }) => {
  const infoCtx = useContext(InfoContext);
  const router = useRouter();
  const user = infoCtx?.user;
  const [name, setName] = useState("Farmer");
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      try {
        if (user?.name) {
          setName(user.name);
          return;
        }
        const raw = await AsyncStorage.getItem("user");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.name) setName(parsed.name);
        }
      } catch (err) {
        console.warn("[Hero] Failed to load name:", err);
      }
    })();
  }, [user]);

  const handleSearch = () => {
    if (!query.trim()) return;
    router.push({
      pathname: "/screens/Search",
      params: { q: query },
    });
  };

  const today = new Date();
  const dateString = today.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <ImageBackground
      source={require("../../assets/images/bg.jpg")}
      style={[styles.background, { height: HERO_HEIGHT }]}
      imageStyle={styles.backgroundImage}
    >
      <View style={styles.overlay}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{`${timeGreeting()}, ${name} 👋`}</Text>
            <Text style={styles.date}>{dateString}</Text>
          </View>
          <Image
            source={
              profileImage
                ? { uri: profileImage }
                : require("../../assets/images/logo.png")
            }
            style={styles.profileImage}
          />
        </View>

        <Text style={styles.subText}>Let’s grow your profits today 🌾</Text>

        {/* SEARCH BAR */}
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search for products or transport..."
            placeholderTextColor="#777"
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
            <Text style={{ color: "#fff", fontWeight: "600" }}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: { width: "100%", justifyContent: "center" },
  backgroundImage: { opacity: 0.25 }, // 💎 reduced blur, more visible background
  overlay: { paddingTop: 24, paddingHorizontal: 20 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  greeting: { fontSize: 22, fontWeight: "800", color: "#184d13" },
  date: { fontSize: 14, color: "#2e7d32", marginTop: 4 },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    resizeMode: "cover",
    borderWidth: 2,
    borderColor: "#a5d6a7",
  },
  subText: {
    fontSize: 15,
    color: "#1b5e20",
    marginTop: 14,
    fontWeight: "500",
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 68,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    padding: 8,
    color: "#000",
    fontSize: 15,
  },
  searchButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
});

export default Hero;
