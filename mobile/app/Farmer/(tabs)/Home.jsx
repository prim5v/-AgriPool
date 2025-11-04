// app/Farmer/(tabs)/Home.jsx
import React, { useState, useCallback } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  RefreshControl,
} from "react-native";
import { InfoProvider } from "../../../_Context/InfoContext"; // ✅ use your correct context path
import Hero from "../../components/Hero";
import Climate from "../../components/Climate";
import TextCarousel from "../../components/TextCarousel";
import ButtonComponent from "../../components/ButtonComponent";
import LiveDashboardCards from "../../components/LiveDashboardCards";
import Notifications from "../../components/Notifications";
import Marketplace from "../../components/Marketplace";
import SmartInsights from "../../components/SmartInsights";

const HomeContent = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);

    // Simulate a data reload — replace this with your actual data fetching logic
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7fff7" }}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
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
        <Climate />
        <TextCarousel />
        <ButtonComponent navigation={navigation} />
        <LiveDashboardCards />
        <Notifications />
        <Marketplace />
        <SmartInsights />
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
