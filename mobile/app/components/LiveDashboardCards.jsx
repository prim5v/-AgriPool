// app/components/LiveDashboardCards.jsx
import React, { useContext } from "react";
import { View, Text, StyleSheet } from "react-native";
import { InfoContext } from "../../_Context/InfoContext";

const LiveDashboardCards = () => {
  const { market } = useContext(InfoContext);

  const priceChange = (name) => {
    // placeholder: negative or positive check; your backend should supply sign
    const val = market.prices?.[name]?.changePercent || 0;
    return val;
  };

  return (
    <View style={{ paddingHorizontal: 12, marginTop: 12 }}>
      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Active Deliveries</Text>
          <Text style={styles.cardBody}>{market.activeDeliveries || "0"} in transit • ETA 2 hrs</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Earnings This Week</Text>
          <Text style={styles.cardBody}>KSh {market.earningsWeek || 0}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.cardFull}>
          <Text style={styles.cardTitle}>Market Prices Today</Text>
          {market.prices && Object.keys(market.prices).length ? (
            Object.keys(market.prices).map((k) => {
              const p = market.prices[k];
              const change = p.changePercent;
              const rising = change > 0;
              return (
                <View key={k} style={styles.priceRow}>
                  <Text style={styles.priceName}>{k}:</Text>
                  <Text style={styles.priceVal}>KSh {p.price}/kg</Text>
                  <Text style={[styles.priceChange, { color: rising ? "#2e7d32" : "#c62828" }]}>
                    {rising ? "🔼 " : "🔽 "}{Math.abs(change || 0)}%
                  </Text>
                </View>
              );
            })
          ) : (
            <Text style={{ color: "#666" }}>No data</Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  card: {
    backgroundColor: "#fff",
    flex: 1,
    marginRight: 8,
    padding: 12,
    borderRadius: 12,
    elevation: 2,
  },
  cardFull: {
    backgroundColor: "#fff",
    flex: 1,
    padding: 12,
    borderRadius: 12,
    elevation: 2,
  },
  cardTitle: { fontWeight: "800", color: "#1b5e20", marginBottom: 6 },
  cardBody: { fontSize: 14 },
  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 6 },
  priceName: { fontWeight: "700" },
  priceVal: { fontWeight: "700" },
  priceChange: { fontWeight: "700" },
});

export default LiveDashboardCards;
