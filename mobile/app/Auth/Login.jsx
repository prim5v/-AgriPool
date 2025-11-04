import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import { router } from "expo-router";
import Animated, {
  FadeInUp,
  FadeInDown,
  FadeIn,
  ZoomIn,
} from "react-native-reanimated";
import { AuthContext } from "../../_Context/Auth.Context";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [isOtpStep, setIsOtpStep] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("Farmer");
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  const { signup, login, verifyOTP } = useContext(AuthContext);

  // Countdown for resend OTP
  useEffect(() => {
    let timer;
    if (isOtpStep && resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer, isOtpStep]);

  // Auto-check for OTP verification
  useEffect(() => {
    let interval;
    if (isOtpStep) {
      interval = setInterval(async () => {
        try {
          const res = await verifyOTP("auto-check");
          if (res?.message === "Account already verified") {
            clearInterval(interval);
            Alert.alert("Success", "Your account has been auto-verified!");
            setIsOtpStep(false);
            setIsLogin(true);
          }
        } catch (err) {
          console.log("Auto verify check:", err.message);
        }
      }, 5000); // every 5s
    }
    return () => clearInterval(interval);
  }, [isOtpStep]);

  // Handle login or signup
  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (!isLogin && !username) {
      Alert.alert("Error", "Please enter a username");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const user = await login(email, password);
        if (user?.role) {
          if (user.role === "Farmer") router.replace("/Farmer/(tabs)/Home");
          else if (user.role === "Buyer") router.replace("/Buyer/(tabs)/Home");
          else if (user.role === "Transporter")
            router.replace("/Transporter/(tabs)/Home");
        }
      } else {
        const res = await signup(username, email, password, role);
        if (res?.message) {
          Alert.alert("Success", "OTP sent to your email!");
          setIsOtpStep(true);
          setResendTimer(60);
        }
      }
    } catch (error) {
      Alert.alert("Error", error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOtp = async () => {
    if (!otp) {
      Alert.alert("Error", "Please enter the OTP.");
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOTP(otp);
      if (res?.message) {
        Alert.alert("Success", "Account verified successfully!");
        setIsOtpStep(false);
        setIsLogin(true);
        setOtp("");
      } else {
        Alert.alert("Verification Failed", res.error || "Invalid OTP");
      }
    } catch (err) {
      Alert.alert("Error", err.message || "Network request failed");
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const res = await signup(username, email, password, role);
      Alert.alert("OTP Resent", "Check your email for the new OTP.");
      setResendTimer(60);
      setOtp("");
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 OTP Verification Screen
  if (isOtpStep) {
    return (
      <Animated.View
        style={otpStyles.container}
        entering={FadeInUp.duration(600)}
      >
        <Animated.Text
          entering={FadeInDown.delay(200).duration(500)}
          style={otpStyles.title}
        >
          Verify Your Email
        </Animated.Text>

        <Animated.Text
          entering={FadeInDown.delay(400).duration(500)}
          style={otpStyles.subtitle}
        >
          We’ve sent a 6-digit OTP to
        </Animated.Text>

        <Text style={otpStyles.emailText}>{email}</Text>

        <Animated.View entering={FadeIn.delay(600)} style={otpStyles.otpBox}>
          <TextInput
            placeholder="Enter OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="numeric"
            style={otpStyles.input}
            maxLength={6}
          />

          <TouchableOpacity
            onPress={handleVerifyOtp}
            style={[otpStyles.verifyBtn, loading && { opacity: 0.6 }]}
            disabled={loading}
          >
            <Text style={otpStyles.verifyText}>
              {loading ? "Verifying..." : "Verify OTP"}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          style={otpStyles.resendContainer}
          onPress={handleResendOtp}
          disabled={resendTimer > 0 || loading}
        >
          <Text style={otpStyles.resendText}>
            {resendTimer > 0
              ? `Resend OTP in ${resendTimer}s`
              : "Didn’t get it? Resend OTP"}
          </Text>
        </TouchableOpacity>

        <Animated.Image
          entering={ZoomIn.delay(800)}
          source={require("../../assets/images/logo.png")}
          style={otpStyles.image}
          resizeMode="contain"
        />

        <Text style={otpStyles.hintText}>
          Waiting for verification... (auto-check active)
        </Text>
      </Animated.View>
    );
  }

  // 🔹 Login / Signup Screen
  return (
    <ScrollView style={styles.container}>
      <Animated.View
        entering={FadeInUp.duration(600)}
        style={styles.content}
      >
        <Text style={styles.title}>AgriPool</Text>
        <Text style={styles.subtitle}>
          {isLogin ? "Welcome Back" : "Create Account"}
        </Text>

        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.image}
          resizeMode="contain"
        />

        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {!isLogin && (
          <View style={styles.roleContainer}>
            <Text style={styles.roleLabel}>Select Role:</Text>
            <View style={styles.roleButtons}>
              {["Farmer", "Buyer", "Transporter"].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.roleButton,
                    role === r && styles.roleButtonActive,
                  ]}
                  onPress={() => setRole(r)}
                >
                  <Text
                    style={[
                      styles.roleButtonText,
                      role === r && styles.roleButtonTextActive,
                    ]}
                  >
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading
              ? "Please wait..."
              : isLogin
              ? "Login"
              : "Sign Up"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text style={styles.switchButtonText}>
            {isLogin
              ? "Don't have an account? Sign Up"
              : "Already have an account? Login"}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

// 🖌️ Main Styles
const styles = StyleSheet.create({
  image: {
    width: 150,
    height: 150,
    alignSelf: "center",
    marginTop: 30,
  },
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  content: { padding: 24, paddingTop: 80 },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#2d6a4f",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  roleContainer: { marginBottom: 16 },
  roleLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  roleButtons: { flexDirection: "row", gap: 8 },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#ddd",
    alignItems: "center",
  },
  roleButtonActive: { backgroundColor: "#2d6a4f", borderColor: "#2d6a4f" },
  roleButtonText: { fontSize: 14, fontWeight: "600", color: "#666" },
  roleButtonTextActive: { color: "#fff" },
  button: {
    backgroundColor: "#2d6a4f",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  switchButton: { marginTop: 16, alignItems: "center" },
  switchButtonText: { color: "#2d6a4f", fontSize: 14 },
});

// 💫 OTP Screen Styles
const otpStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#414A37",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#777",
    marginBottom: 4,
    textAlign: "center",
  },
  emailText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#99744A",
    marginBottom: 20,
    textAlign: "center",
  },
  otpBox: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#99744A",
    borderRadius: 10,
    fontSize: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    textAlign: "center",
    letterSpacing: 5,
    color: "#333",
    marginBottom: 16,
  },
  verifyBtn: {
    backgroundColor: "#414A37",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  verifyText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  resendContainer: { marginTop: 20 },
  resendText: {
    color: "#99744A",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
  },
  image: {
    width: 180,
    height: 180,
    marginTop: 40,
  },
  hintText: {
    marginTop: 12,
    color: "#777",
    fontSize: 13,
    textAlign: "center",
  },
});
