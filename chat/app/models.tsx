import { View, Text, FlatList, Pressable, Alert } from "react-native";
import { useEffect } from "react";
import { useState } from "react";
import { Download, X, Check, Trash2 } from "lucide-react-native";
import { availableModels, getModelPath } from "@/services/modelFileService";
import { cancelDownload, downloadModel } from "@/services/downloadService";
import {
  deleteDownloadedModel,
  isModelDownloaded,
  saveModelMetadata,
} from "@/services/modelRepo";
import { subscribeToModelStore } from "@/services/modelEvents";

export default function ModelsScreen() {
  const [progress, setProgress] = useState<Record<string, number>>({});

  const [status, setStatus] = useState<
    Record<string, "idle" | "downloading" | "done">
  >({});

  async function startDownload(model: any) {
    try {
      setStatus((prev) => ({
        ...prev,
        [model.id]: "downloading",
      }));

      await downloadModel(
        model.url,
        model.filename,
        (value) => {
          setProgress((prev) => ({
            ...prev,
            [model.id]: value,
          }));
        },
        model.id,
      );

      await saveModelMetadata({
        ...model,

        path: getModelPath(model.filename),
      });

      setStatus((prev) => ({
        ...prev,
        [model.id]: "done",
      }));
    } catch (error) {
      console.log(error);

      Alert.alert("Download failed", "Unable to download model");

      setStatus((prev) => ({
        ...prev,
        [model.id]: "idle",
      }));
    }
  }

  async function refreshDownloadedStatus() {
    const downloadedStatus: Record<string, "idle" | "downloading" | "done"> =
      {};

    for (const model of availableModels) {
      const downloaded = await isModelDownloaded(model.id);

      downloadedStatus[model.id] = downloaded ? "done" : "idle";
    }

    setStatus((prev) => {
      const next = { ...downloadedStatus };

      for (const modelId of Object.keys(prev)) {
        if (prev[modelId] === "downloading") {
          next[modelId] = prev[modelId];
        }
      }

      return next;
    });
  }

  function confirmDeleteModel(model: any) {
    Alert.alert("Delete model", `Delete "${model.name}" from this device?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteDownloadedModel(model.id);
          setProgress((prev) => ({
            ...prev,
            [model.id]: 0,
          }));
          await refreshDownloadedStatus();
        },
      },
    ]);
  }

  useEffect(() => {
    refreshDownloadedStatus();

    return subscribeToModelStore(refreshDownloadedStatus);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        padding: 20,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
        paddingTop: 50,
      }}
    >
      <Text
        style={{
          fontSize: 25,
          fontWeight: "800",
        }}
      >
        Models
      </Text>

      <Text
        style={{
          color: "#666",
          marginBottom: 20,
          fontSize: 14,
        }}
      >
        Download offline AI models
      </Text>

      <FlatList
        showsVerticalScrollIndicator={false}
        data={availableModels}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const state = status[item.id] ?? "idle";

          const percent = Math.floor((progress[item.id] ?? 0) * 100);

          return (
            <View
              style={{
                borderWidth: 1,
                borderColor: "#e5e5e5",
                borderRadius: 20,
                padding: 18,
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 19,
                  fontWeight: "700",
                }}
              >
                {item.name}
              </Text>

              <Text
                style={{
                  color: "#555",
                  marginTop: 6,
                }}
              >
                {item.description}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: 12,
                }}
              >
                <Text>{item.size}</Text>

                <Text>{item.ramRequired}</Text>
              </View>

              {state === "downloading" ? (
                <View
                  style={{
                    marginTop: 15,
                  }}
                >
                  <View
                    style={{
                      height: 8,
                      backgroundColor: "#eee",
                      borderRadius: 10,
                    }}
                  >
                    <View
                      style={{
                        width: `${percent}%`,
                        height: 8,
                        backgroundColor: "#208AEF",
                        borderRadius: 10,
                      }}
                    />
                  </View>

                  <Text
                    style={{
                      marginTop: 8,
                    }}
                  >
                    {percent}% downloaded
                  </Text>
                </View>
              ) : null}

              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                  marginTop: 15,
                }}
              >
                {state === "idle" && (
                  <Pressable
                    onPress={() => startDownload(item)}
                    style={{
                      flex: 1,
                      backgroundColor: "#208AEF",
                      padding: 13,
                      borderRadius: 12,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <Download color="white" size={18} />

                    <Text
                      style={{
                        color: "white",
                        fontWeight: "700",
                      }}
                    >
                      Download
                    </Text>
                  </Pressable>
                )}

                {state === "downloading" && (
                  <>
                    <Pressable
                      onPress={async () => {
                        await cancelDownload(item.id);
                        setProgress((prev) => ({
                          ...prev,
                          [item.id]: 0,
                        }));
                        setStatus((prev) => ({
                          ...prev,
                          [item.id]: "idle",
                        }));
                      }}
                      style={{
                        width: "100%",
                        backgroundColor: "#ff4444",
                        borderRadius: 12,
                        flexDirection: "row",
                        gap: 5,
                        padding: 10,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <X color="white" />
                      <Text
                        style={{
                          color: "white",
                          fontSize: 16,
                          fontWeight: 600,
                        }}
                      >
                        Cancel
                      </Text>
                    </Pressable>
                  </>
                )}

                {state === "done" && (
                  <>
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: "#16a34a",
                        padding: 13,
                        borderRadius: 12,
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      <Check color="white" />

                      <Text
                        style={{
                          color: "white",
                          fontWeight: "700",
                        }}
                      >
                        Installed
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => confirmDeleteModel(item)}
                      style={{
                        width: 50,
                        backgroundColor: "#fee2e2",
                        borderRadius: 12,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Trash2 color="#b91c1c" size={18} />
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}
