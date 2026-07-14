import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { API_URL, getTournaments, type Tournament } from "./api";

export default function App() {
  const [items, setItems] = useState<Tournament[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setItems(await getTournaments());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Tournaments</Text>
        <Text style={styles.host}>{API_URL.replace(/^https?:\/\//, "")}</Text>
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.error}>Could not reach the API</Text>
          <Text style={styles.errorDetail}>{error}</Text>
        </View>
      ) : items === null ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.errorDetail}>No tournaments yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>
                {item.participant_count} players
                {item.status ? ` · ${item.status}` : ""}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f6f7f9" },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 30, fontWeight: "700", color: "#0d1117" },
  host: { marginTop: 2, fontSize: 12, color: "#8b949e" },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e6e8eb",
  },
  name: { fontSize: 17, fontWeight: "600", color: "#0d1117" },
  meta: { marginTop: 4, fontSize: 13, color: "#6b7280" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  error: { fontSize: 16, fontWeight: "600", color: "#b42318" },
  errorDetail: { marginTop: 6, fontSize: 13, color: "#6b7280", textAlign: "center" },
});
