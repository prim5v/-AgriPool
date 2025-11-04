import React, { useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");

const Collections = ({ onScrollToProducts }) => {
  const collections = [
    { name: "Fresh Produce", image: "https://i.pinimg.com/736x/ac/2c/9e/ac2c9e94287f97a5c4f0a2e1543e9c44.jpg" },
    { name: "Livestock", image: "https://i.pinimg.com/1200x/05/ac/c2/05acc201e2217aee450a2234280b26fc.jpg" },
    { name: "Grains & Staples", image: "https://i.pinimg.com/736x/7a/4f/70/7a4f70bfb912240e0c8f642edf77c0e9.jpg" },
    { name: "Dairy & Animal Products", image: "https://i.pinimg.com/736x/b9/76/bb/b976bb156ede2ce05ec0a8db213f9b96.jpg" },
    { name: "Processed Products", image: "https://i.pinimg.com/1200x/2d/62/94/2d62940fe3120a11053d4bf2de408e02.jpg" },
    { name: "Coffee & Tea Products", image: "https://i.pinimg.com/1200x/d0/1d/23/d01d23c3c14413bd6e2a37e63790857a.jpg" },
    { name: "Agricultural Inputs", image: "https://i.pinimg.com/736x/08/16/a9/0816a917b1abfdb05eb91c45507c11a9.jpg" },
    { name: "Flowers & Ornamental Plants", image: "https://i.pinimg.com/1200x/cb/f9/18/cbf918e8df045508bd0585fafc9a762a.jpg" },
    { name: "Agroforestry & Specialty Crops", image: "https://i.pinimg.com/736x/c1/50/8b/c1508b805d3f08211342e2b72aed625d.jpg" },
  ];

  const scrollX = useRef(new Animated.Value(0)).current;
  const cardWidth = 100;
  const cardSpacing = 12;

  return (
    <View style={styles.container}>
      {/* Animated Dots */}
      <View style={styles.dotsContainer}>
        {collections.map((_, i) => {
          const dotWidth = scrollX.interpolate({
            inputRange: [
              (cardWidth + cardSpacing) * (i - 1),
              (cardWidth + cardSpacing) * i,
              (cardWidth + cardSpacing) * (i + 1),
            ],
            outputRange: [8, 16, 8],
            extrapolate: "clamp",
          });
          const opacity = scrollX.interpolate({
            inputRange: [
              (cardWidth + cardSpacing) * (i - 1),
              (cardWidth + cardSpacing) * i,
              (cardWidth + cardSpacing) * (i + 1),
            ],
            outputRange: [0.3, 1, 0.3],
            extrapolate: "clamp",
          });
          return <Animated.View key={i} style={[styles.dot, { width: dotWidth, opacity }]} />;
        })}
      </View>

      <Text style={styles.title}>Collections</Text>

      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + cardSpacing}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        contentContainerStyle={{ paddingHorizontal: 15 }}
      >
        {collections.map((col, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.card, { width: cardWidth }]}
            activeOpacity={0.8}
            onPress={() => {
              if (onScrollToProducts) onScrollToProducts();
            }}
          >
            <Image source={{ uri: col.image }} style={styles.image} />
            <Text style={styles.name}>{col.name}</Text>
          </TouchableOpacity>
        ))}
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 20 },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1b5e20",
    marginHorizontal: 4,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#1b5e20", marginBottom: 10, paddingHorizontal: 15 },
  card: {
    height: 140,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginRight: 12,
    elevation: 2,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  image: {
    width: "100%",
    height: 90,
    borderRadius: 8,
  },
  name: { marginTop: 6, fontWeight: "600", color: "#333", fontSize: 12, textAlign: "center" },
});

export default Collections;
