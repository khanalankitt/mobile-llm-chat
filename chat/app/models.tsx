import { View, Text, FlatList, Pressable, Alert } from "react-native";
import { useEffect } from "react";
import { useState } from "react";
import { Download, Pause, Play, X, Check } from "lucide-react-native";
import { availableModels, getModelPath } from "@/services/modelFileService";
import {
  cancelDownload,
  downloadModel,
  modelExists,
  pauseDownload,
  resumeDownload,
} from "@/services/downloadService";
import { saveModelMetadata } from "@/services/modelRepo";

export default function ModelsScreen() {
  const [progress, setProgress] = useState<Record<string, number>>({});

  const [status, setStatus] = useState<
    Record<string, "idle" | "downloading" | "paused" | "done">
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

      setStatus((prev) => ({
        ...prev,
        [model.id]: "done",
      }));

      await saveModelMetadata({
        ...model,

        path: getModelPath(model.filename),
      });
    } catch (error) {
      console.log(error);

      Alert.alert("Download failed", "Unable to download model");

      setStatus((prev) => ({
        ...prev,
        [model.id]: "idle",
      }));
    }
  }

  useEffect(() => {
    async function checkDownloadedModels() {
      const downloadedStatus: any = {};

      for (const model of availableModels) {
        const exists = await modelExists(model.filename);

        if (exists) {
          downloadedStatus[model.id] = "done";
        }
      }

      setStatus(downloadedStatus);
    }

    checkDownloadedModels();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        padding: 20,
        backgroundColor: "#fff",
        paddingTop: 50,
      }}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: "800",
          marginBottom: 5,
        }}
      >
        Models
      </Text>

      <Text
        style={{
          color: "#666",
          marginBottom: 20,
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

              {state === "downloading" || state === "paused" ? (
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
                      onPress={() => pauseDownload(item.id)}
                      style={{
                        flex: 1,
                        backgroundColor: "#222",
                        padding: 13,
                        borderRadius: 12,
                        alignItems: "center",
                      }}
                    >
                      <Pause color="white" size={18} />
                    </Pressable>

                    <Pressable
                      onPress={() => cancelDownload(item.id)}
                      style={{
                        width: 50,
                        backgroundColor: "#ff4444",
                        borderRadius: 12,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <X color="white" />
                    </Pressable>
                  </>
                )}

                {state === "paused" && (
                  <Pressable
                    onPress={() => resumeDownload(item.id)}
                    style={{
                      flex: 1,
                      backgroundColor: "#208AEF",
                      padding: 13,
                      borderRadius: 12,
                      alignItems: "center",
                    }}
                  >
                    <Play color="white" size={18} />
                  </Pressable>
                )}

                {state === "done" && (
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
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}
