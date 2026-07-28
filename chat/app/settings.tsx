import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  clearAllStoredHistory,
  deleteAllStoredModels,
  deleteStoredModel,
  getStoredChatHistory,
  getStoredModels,
  type ChatSession,
  type StoredModel,
} from "../src/services/settingsService";

export default function SettingsScreen() {
  const [models, setModels] = useState<StoredModel[]>([]);
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    try {
      const [savedModels, savedHistory] = await Promise.all([
        getStoredModels(),
        getStoredChatHistory(),
      ]);
      setModels(savedModels);
      setHistory(savedHistory);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const confirmDeleteModel = (modelId: string, modelName: string) => {
    Alert.alert(
      "Delete model",
      `Delete "${modelName}" and its linked chat history?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteStoredModel(modelId);
            await refreshData();
          },
        },
      ],
    );
  };

  const confirmDeleteAllModels = () => {
    Alert.alert(
      "Delete all models",
      "This will remove all saved models from storage.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete all",
          style: "destructive",
          onPress: async () => {
            await deleteAllStoredModels();
            await refreshData();
          },
        },
      ],
    );
  };

  const confirmClearHistory = () => {
    Alert.alert(
      "Clear all history",
      "This will remove all stored chat history.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear all",
          style: "destructive",
          onPress: async () => {
            await clearAllStoredHistory();
            await refreshData();
          },
        },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Models</Text>
        <Text style={styles.sectionDescription}>
          Delete a single saved model or remove every saved model.
        </Text>

        {loading ? (
          <ActivityIndicator style={styles.loader} />
        ) : models.length === 0 ? (
          <Text style={styles.emptyText}>No saved models.</Text>
        ) : (
          models.map((model) => (
            <View key={model.id} style={styles.row}>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>{model.name}</Text>
                {model.provider ? (
                  <Text style={styles.rowSubtitle}>{model.provider}</Text>
                ) : null}
              </View>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => confirmDeleteModel(model.id, model.name)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={confirmDeleteAllModels}
          disabled={models.length === 0}
        >
          <Text style={styles.actionButtonText}>Delete all models</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>History</Text>
        <Text style={styles.sectionDescription}>
          Clear all stored conversations across all models.
        </Text>

        <Text style={styles.historyCount}>
          {history.length} conversation{history.length === 1 ? "" : "s"} stored
        </Text>

        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={confirmClearHistory}
          disabled={history.length === 0}
        >
          <Text style={styles.actionButtonText}>Clear all history</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
    backgroundColor: "#f5f7fb",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 16,
    color: "#111827",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
    color: "#111827",
  },
  sectionDescription: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 12,
  },
  loader: { marginVertical: 8 },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  rowContent: {
    flex: 1,
    marginRight: 12,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  rowSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#fee2e2",
  },
  deleteButtonText: {
    color: "#b91c1c",
    fontWeight: "600",
  },
  actionButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  dangerButton: {
    backgroundColor: "#dc2626",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  historyCount: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 4,
  },
});
