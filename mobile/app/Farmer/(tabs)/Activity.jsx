import React, { useState, useCallback } from "react";
import { ScrollView, RefreshControl } from "react-native";
import GetProducts from "../../components/GetProducts";

const Activity = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // triggers refresh

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Increment key to force GetProducts to reload
    setRefreshKey(prev => prev + 1);
    setTimeout(() => setRefreshing(false), 1500); // stop spinner after fetch
  }, []);

  return (
    <ScrollView
      contentContainerStyle={{ paddingVertical: 10 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#0077b6"]}
          tintColor="#0077b6"
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <GetProducts key={refreshKey} /> {/* Key change forces remount */}
    </ScrollView>
  );
};

export default Activity;
