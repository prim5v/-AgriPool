// app/components/TextCarousel.jsx
import React, { useRef, useEffect } from "react";
import { View, Text, Animated, Dimensions, StyleSheet } from "react-native";

const { width } = Dimensions.get("window");

const TextCarousel = ({ texts = ["Welcome to AgriPool", "Prices updated", "Reminder: Book transport early"] }) => {
  const x = useRef(new Animated.Value(width)).current;

  useEffect(() => {
    let cur = 0;
    const animate = () => {
      x.setValue(width);
      Animated.timing(x, { toValue: -width, duration: 9000, useNativeDriver: true }).start(() => {
        cur = (cur + 1) % texts.length;
        animate();
      });
    };
    animate();
    // cleanup intentionally minimal so it keeps running while mounted
  }, [x, texts]);

  return (
    <View style={styles.wrapper}>
      <Animated.Text style={[styles.marquee, { transform: [{ translateX: x }] }]}>
        {texts.join("   •   ")}
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    height: 42,
    marginHorizontal: 12,
    marginTop: 12,
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  marquee: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1b5e20",
  },
});

export default TextCarousel;
