import { View, Text, FlatList, Pressable, Alert } from "react-native";
import { useEffect, useMemo, useState } from "react";
import {
  Download,
  X,
  Check,
  Trash2,
  HardDrive,
  Star,
  MemoryStick,
  DatabaseArrowDown,
} from "lucide-react-native";
import { availableModels, getModelPath } from "@/services/modelFileService";
import { cancelDownload, downloadModel } from "@/services/downloadService";
import {
  deleteDownloadedModel,
  isModelDownloaded,
  saveModelMetadata,
} from "@/services/modelRepo";
import { subscribeToModelStore } from "@/services/modelEvents";
import {
  getDeviceSpecs,
  getSuggestedModels,
  getBestModel,
  formatBytes,
  DeviceSpecs,
  ModelFit,
  RamTier,
} from "@/services/deviceInfo";

type DownloadState = "idle" | "downloading" | "done";

const RAM_TIER_COLOR: Record<RamTier, { bg: string; text: string }> = {
  comfortable: { bg: "#dcfce7", text: "#15803d" },
  runs: { bg: "#dbeafe", text: "#1d4ed8" },
  risky: { bg: "#fef3c7", text: "#b45309" },
  unsupported: { bg: "#fee2e2", text: "#b91c1c" },
};

export default function ModelsScreen() {
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<Record<string, DownloadState>>({});
  const [specs, setSpecs] = useState<DeviceSpecs | null>(null);
  const [specsLoading, setSpecsLoading] = useState(true);

  async function refreshSpecs(forceRefresh = false) {
    setSpecsLoading(true);
    try {
      const result = await getDeviceSpecs(forceRefresh);
      setSpecs(result);
    } catch (error) {
      console.log("Failed to read device specs", error);
    } finally {
      setSpecsLoading(false);
    }
  }

  async function refreshDownloadedStatus() {
    const downloadedStatus: Record<string, DownloadState> = {};

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

  useEffect(() => {
    refreshDownloadedStatus();
    refreshSpecs();

    return subscribeToModelStore(refreshDownloadedStatus);
  }, []);

  // Rank the catalog against this device's specs. Recomputed only when
  // specs change, not on every render.
  const suggestions = useMemo<ModelFit[]>(() => {
    if (!specs) return [];
    return getSuggestedModels(availableModels, specs);
  }, [specs]);

  const bestFit = useMemo(() => {
    if (!specs) return null;
    return getBestModel(availableModels, specs);
  }, [specs]);

  async function runDownload(model: (typeof availableModels)[number]) {
    try {
      setStatus((prev) => ({ ...prev, [model.id]: "downloading" }));

      await downloadModel(
        model.url,
        model.filename,
        (value) => {
          setProgress((prev) => ({ ...prev, [model.id]: value }));
        },
        model.id,
      );

      await saveModelMetadata({
        ...model,
        path: getModelPath(model.filename),
      });

      setStatus((prev) => ({ ...prev, [model.id]: "done" }));
      refreshSpecs(true); // storage just changed
    } catch (error) {
      console.log(error);
      Alert.alert("Download failed", "Unable to download model");
      setStatus((prev) => ({ ...prev, [model.id]: "idle" }));
    }
  }

  function startDownload(
    model: (typeof availableModels)[number],
    fit: ModelFit,
  ) {
    if (!fit.fitsStorage) {
      Alert.alert(
        "Not enough storage",
        `This model needs ${formatBytes(
          fit.storageShortfall,
        )} more free space than you currently have.`,
      );
      return;
    }

    if (!fit.fitsRam) {
      Alert.alert(
        "May not run well",
        "This model is larger than your device's RAM comfortably supports. It may run slowly, or the app could crash while using it. Download anyway?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Download Anyway", onPress: () => runDownload(model) },
        ],
      );
      return;
    }

    runDownload(model);
  }

  function confirmDeleteModel(model: (typeof availableModels)[number]) {
    Alert.alert("Delete model", `Delete "${model.name}" from this device?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteDownloadedModel(model.id);
          setProgress((prev) => ({ ...prev, [model.id]: 0 }));
          await refreshDownloadedStatus();
          refreshSpecs(true); // storage just freed up
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", paddingTop: 50 }}>
      <View style={{ paddingHorizontal: 20, alignItems: "center" }}>
        <Text style={{ fontSize: 25, fontWeight: "800" }}>Models</Text>
        <Text style={{ color: "#666", marginBottom: 16, fontSize: 14 }}>
          Download offline AI models
        </Text>
      </View>

      {/* Device specs summary */}
      <View
        style={{
          marginHorizontal: 20,
          marginBottom: 16,
          padding: 14,
          borderRadius: 16,
          backgroundColor: "#f5f7fb",
          flexDirection: "row",
          justifyContent: "space-around",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <MemoryStick size={18} color="#374151" />
          <Text style={{ fontSize: 13, color: "#374151", fontWeight: "600" }}>
            {specsLoading || !specs
              ? "Checking RAM…"
              : `${formatBytes(specs.totalMemory)} RAM`}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <HardDrive size={16} color="#374151" />
          <Text style={{ fontSize: 13, color: "#374151", fontWeight: "600" }}>
            {specsLoading || !specs
              ? "Checking storage…"
              : `${formatBytes(specs.freeStorage)} free`}
          </Text>
        </View>
      </View>

      <FlatList
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
        data={
          specs
            ? suggestions
            : availableModels.map((model) => ({ model }) as ModelFit)
        }
        keyExtractor={(fit) => fit.model.id}
        renderItem={({ item: fit }) => {
          const item = fit.model;
          const state = status[item.id] ?? "idle";
          const percent = Math.floor((progress[item.id] ?? 0) * 100);
          const isRecommended = bestFit?.model.id === item.id;
          const tierStyle = specs ? RAM_TIER_COLOR[fit.ramTier] : null;

          return (
            <View
              style={{
                borderWidth: isRecommended ? 2 : 1,
                borderColor: isRecommended ? "#208AEF" : "#e5e5e5",
                borderRadius: 20,
                padding: 18,
                marginBottom: 16,
              }}
            >
              {isRecommended && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    marginBottom: 8,
                  }}
                >
                  <Star size={14} color="#208AEF" fill="#208AEF" />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: "#208AEF",
                    }}
                  >
                    Recommended for your device
                  </Text>
                </View>
              )}

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={{ fontSize: 19, fontWeight: "700" }}>
                    {item.name}
                  </Text>
                  <Text style={{ color: "#555", marginTop: 6, fontSize: 12 }}>
                    {item.description}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: 12,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <DatabaseArrowDown size={16} color="#374151" />
                  <Text
                    style={{
                      fontSize: 13,
                      color: "#374151",
                      marginLeft: 4,
                    }}
                  >
                    {item.size} download
                  </Text>
                </View>
                <Text style={{ fontSize: 13, color: "#374151" }}>
                  {item.ramLabel}
                </Text>
              </View>

              {!fit.fitsStorage && state === "idle" && (
                <Text style={{ color: "#b91c1c", fontSize: 12, marginTop: 8 }}>
                  Needs {formatBytes(fit.storageShortfall)} more free storage
                </Text>
              )}

              {state === "downloading" ? (
                <View
                  style={{
                    marginTop: 15,
                    padding: 14,
                    backgroundColor: "#f8fafc",
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                  }}
                >
                  {/* Progress Header */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "700",
                        color: "#111827",
                      }}
                    >
                      Downloading model
                    </Text>

                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "700",
                        color: "#208AEF",
                      }}
                    >
                      {percent}%
                    </Text>
                  </View>

                  {/* Progress Bar */}
                  <View
                    style={{
                      height: 10,
                      backgroundColor: "#e5e7eb",
                      borderRadius: 20,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        width: `${percent}%`,
                        height: "100%",
                        backgroundColor: "#208AEF",
                        borderRadius: 20,
                      }}
                    />
                  </View>

                  {/* Info */}
                  <View
                    style={{
                      marginTop: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 10,
                        backgroundColor: "#208AEF",
                      }}
                    />

                    <Text
                      style={{
                        flex: 1,
                        fontSize: 12,
                        color: "#64748b",
                        lineHeight: 18,
                      }}
                    >
                      Keep this screen open while downloading. This is a
                      one-time setup process. Background download is not supported yet.
                    </Text>
                  </View>
                </View>
              ) : null}

              <View style={{ flexDirection: "row", gap: 10, marginTop: 15 }}>
                {state === "idle" && (
                  <Pressable
                    onPress={() => startDownload(item, fit)}
                    disabled={!specs}
                    style={{
                      flex: 1,
                      backgroundColor:
                        specs && !fit.fitsStorage ? "#93c5fd" : "#208AEF",
                      padding: 13,
                      borderRadius: 12,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <Download color="white" size={18} />
                    <Text style={{ color: "white", fontWeight: "700" }}>
                      Download
                    </Text>
                  </Pressable>
                )}

                {state === "downloading" && (
                  <Pressable
                    onPress={async () => {
                      await cancelDownload(item.id);
                      setProgress((prev) => ({ ...prev, [item.id]: 0 }));
                      setStatus((prev) => ({ ...prev, [item.id]: "idle" }));
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
                        fontWeight: "600",
                      }}
                    >
                      Cancel
                    </Text>
                  </Pressable>
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
                      <Text style={{ color: "white", fontWeight: "700" }}>
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
