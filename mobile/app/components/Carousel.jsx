import React, { useRef, useState } from "react";
import { View, Image, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import Carousel from "react-native-reanimated-carousel";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

const CarouselComponent = () => {
  const router = useRouter();
  const carouselRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const images = [
    "https://i.pinimg.com/736x/6c/7d/3b/6c7d3b8bf1d809ab0d56326eadd16006.jpg", // maize
    "https://i.pinimg.com/736x/1e/44/39/1e443995d3f00964f8302692d474985f.jpg", // coffee beans
    "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce", // tomatoes
    "https://images.unsplash.com/photo-1582515073490-39981397c445", // dairy cow
    "https://i.pinimg.com/1200x/98/d6/7f/98d67f9e08057bd62f9726edcf8571a5.jpg", // vegetables
  ];

  const handlePress = () => {
    router.push("/screens/Info");
  };

  return (
    <View style={styles.container}>
      <Carousel
        ref={carouselRef}
        loop
        width={width * 0.95}              // Slight padding around sides
        height={180}                       
        autoPlay
        autoPlayInterval={3500}
        data={images}
        onSnapToItem={setActiveIndex}
        mode="horizontal-stack"            // Optional: better 3D stack effect
        modeConfig={{
          snapDirection: "left",
          stackInterval: 18,
        }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
            <Image source={{ uri: item }} style={styles.image} />
          </TouchableOpacity>
        )}
        style={{ alignSelf: "center" }}    // Center carousel
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    alignItems: "center",
  },
    image: {
  width: width * 0.9,
  height: 180,
  borderRadius: 20,
  borderTopLeftRadius: 40,
  borderTopRightRadius: 40,
  borderBottomLeftRadius: 40,
  borderBottomRightRadius: 40,
  resizeMode: "cover",
}
});

export default CarouselComponent;
