// app/screens/upload.jsx
import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import Animated, { FadeInUp, FadeInDown, ZoomIn } from "react-native-reanimated";
import { AuthContext } from "../../_Context/Auth.Context";
import ApiSocket from "../ApiSocket";
import { Ionicons } from "@expo/vector-icons";

export default function Upload() {
  const { user } = useContext(AuthContext);
  const router = useRouter();

  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [unit, setUnit] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImages((prev) => [
        ...prev,
        ...result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.uri.split("/").pop(),
          type: "image/jpeg",
        })),
      ]);
    }
  };

  const resetForm = () => {
    setProductName("");
    setDescription("");
    setPrice("");
    setStock("");
    setUnit("");
    setImages([]);
    setSuccessData(null);
  };

  const handleUpload = async () => {
    if (!productName || !price || !stock || !unit || images.length === 0) {
      Alert.alert("Error", "All fields and at least one image are required.");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("product_name", productName);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("stock", stock);
      formData.append("unit", unit);
      formData.append("user_id", user?.user_id);

      images.forEach((img) => {
        formData.append("product_images", {
          uri: img.uri,
          name: img.name,
          type: img.type,
        });
      });

      const res = await ApiSocket.post("/upload-product", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.product) {
        setSuccessData(res.data.product);
      } else {
        Alert.alert("Error", "Unexpected response from server");
      }
    } catch (error) {
      console.error("[UPLOAD ERROR]", error.response?.data || error.message);
      Alert.alert("Upload failed", error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Success Screen
  if (successData) {
    return (
      <Animated.View
        style={styles.successContainer}
        entering={FadeInUp.duration(500)}
      >
        <TouchableOpacity
          onPress={() => setSuccessData(null)}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={26} color="#2d6a4f" />
        </TouchableOpacity>

        <Animated.Image
          entering={ZoomIn.delay(200)}
          source={require("../../assets/images/logo.png")}
          style={styles.successImage}
          resizeMode="contain"
        />
        <Text style={styles.successTitle}>Product Uploaded Successfully</Text>

        <View style={styles.infoBox}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{successData.product_name}</Text>

          <Text style={styles.label}>Price:</Text>
          <Text style={styles.value}>KSh {successData.price}/{successData.unit}</Text>

          <Text style={styles.label}>Selling Price:</Text>
          <Text style={[styles.value, { color: "#1b5e20", fontWeight: "700" }]}>
            KSh {successData.selling_price}/{successData.unit}
          </Text>

          <Text style={styles.label}>Stock:</Text>
          <Text style={styles.value}>
            {successData.stock} {successData.unit}
          </Text>

          <Text style={[styles.label, { marginTop: 12 }]}>
            🕓 You’ll be notified once your product gets an order.
          </Text>
        </View>

        <ScrollView horizontal style={{ marginTop: 12 }}>
          {successData.images?.map((img, idx) => (
            <Image
              key={idx}
              source={{
                uri: `https://backendagripool4293.pythonanywhere.com/mysite/static/images/${img}`,
              }}
              style={styles.uploadedImage}
            />
          ))}
        </ScrollView>

        <View style={styles.successActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#2d6a4f" }]}
            onPress={resetForm}
          >
            <Text style={styles.actionText}>+ Upload Another</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#1b4332" }]}
            onPress={() => router.push("/Farmer/Home")}
          >
            <Text style={styles.actionText}>Go to My Products</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  // 🔹 Upload Form
  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={26} color="#2d6a4f" />
      </TouchableOpacity>

      <Animated.View
        entering={FadeInDown.duration(600)}
        style={styles.formContainer}
      >
        <Text style={styles.title}>Upload Product</Text>
        <Text style={styles.subtitle}>Add your farm produce below</Text>

        <TextInput
          style={styles.input}
          placeholder="Product Name"
          value={productName}
          onChangeText={setProductName}
        />

        <TextInput
          style={[styles.input, { height: 100, textAlignVertical: "top" }]}
          placeholder="Description (optional)"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <TextInput
          style={styles.input}
          placeholder="Price (Ksh) per unit"
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
        />

        <TextInput
          style={styles.input}
          placeholder="Stock Available"
          keyboardType="numeric"
          value={stock}
          onChangeText={setStock}
        />

        <TextInput
          style={styles.input}
          placeholder="Unit (e.g. kg, litres, bunches)"
          value={unit}
          onChangeText={setUnit}
        />

        <TouchableOpacity
          style={styles.pickButton}
          onPress={pickImages}
        >
          <Text style={styles.pickButtonText}>📸 Pick Images</Text>
        </TouchableOpacity>

        <ScrollView horizontal>
          {images.map((img, idx) => (
            <Image key={idx} source={{ uri: img.uri }} style={styles.previewImage} />
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={handleUpload}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Upload Product</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

// 💅 Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 20 },
  backButton: { marginTop: 40, marginBottom: 10 },
  formContainer: { marginTop: 10 },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2d6a4f",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 14,
  },
  pickButton: {
    backgroundColor: "#e8f5e9",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2d6a4f",
  },
  pickButtonText: {
    color: "#2d6a4f",
    fontWeight: "700",
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 8,
    marginTop: 8,
  },
  button: {
    backgroundColor: "#2d6a4f",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  // ✅ Success View
  successContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
  },
  successImage: {
    width: 160,
    height: 160,
    marginVertical: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2d6a4f",
    marginBottom: 12,
    textAlign: "center",
  },
  infoBox: {
    backgroundColor: "#fff",
    width: "100%",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  label: { fontSize: 15, fontWeight: "600", color: "#333", marginTop: 6 },
  value: { fontSize: 16, color: "#666", marginBottom: 4 },
  uploadedImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  successActions: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  actionBtn: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  actionText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
