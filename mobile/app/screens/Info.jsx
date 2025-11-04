// app/screens/Info.jsx
import React from "react";
import { View, Text, ScrollView, Image, StyleSheet, SafeAreaView } from "react-native";

const Info = () => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fff8" }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1578302758061-01f2959b5f8e",
          }}
          style={styles.image}
        />
        <Text style={styles.title}>About Agripool</Text>
        <Text style={styles.paragraph}>
          Agripool is a smart agricultural marketplace designed to connect farmers,
          buyers, and service providers across Africa. Our mission is to make
          agriculture profitable, transparent, and sustainable using modern tech
          tools. 
        </Text>
        <Text style={styles.paragraph}>
          From farm input access to logistics, market insights, and climate
          updates — Agripool empowers farmers to scale smarter, not harder.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: "center" },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1b5e20",
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    textAlign: "justify",
    marginBottom: 10,
  },
});

export default Info;
