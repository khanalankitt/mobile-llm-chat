import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";

import { useCallback, useEffect, useRef, useState } from "react";
import { getDownloadedModels } from "@/services/modelRepo";
import { generateResponseStream, loadModel } from "@/services/llamaService";
import { ArrowDown } from "lucide-react-native";
import { Link, router } from "expo-router";
import { useFocusEffect } from "expo-router";
import { subscribeToModelStore } from "@/services/modelEvents";

type Model = {
  id: string;
  name: string;
  path: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatScreen() {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const loadRequestId = useRef(0);
  const messagesListRef = useRef<FlatList<Message> | null>(null);

  const refreshModels = useCallback(async () => {
    const data = (await getDownloadedModels()) as Model[];
    setModels(data);
    setSelectedModel((current) => {
      if (!current) {
        return current;
      }

      if (data.some((model) => model.id === current.id)) {
        return current;
      }

      setModelLoading(false);
      return null;
    });
  }, []);

  useEffect(() => subscribeToModelStore(refreshModels), [refreshModels]);

  useFocusEffect(
    useCallback(() => {
      refreshModels();
    }, [refreshModels]),
  );

  async function selectModel(model: Model) {
    const requestId = loadRequestId.current + 1;
    loadRequestId.current = requestId;

    setSelectedModel(model);
    setShowDropdown(false);
    setModelLoading(true);

    try {
      await loadModel(model.path);

      if (loadRequestId.current === requestId) {
        setModelLoading(false);
      }
    } catch (error) {
      console.log(error);

      if (loadRequestId.current === requestId) {
        setSelectedModel(null);
        setModelLoading(false);
        Alert.alert(
          "Model failed to load",
          "Please try selecting the model again.",
        );
      }
    }
  }

  async function sendMessage() {
    const prompt = input.trim();

    if (!prompt || !selectedModel || modelLoading || loading) return;

    const userMessage: Message = {
      role: "user",
      content: prompt,
    };

    const assistantMessage: Message = {
      role: "assistant",
      content: "",
    };

    const MAX_HISTORY_MESSAGES = 12;
    const conversationHistory = [...messages, userMessage].slice(
      -MAX_HISTORY_MESSAGES,
    );

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setLoading(true);

    let streamedResponse = "";

    try {
      const response = await generateResponseStream(
        conversationHistory,
        (token) => {
          streamedResponse += token;

          setMessages((prev) => {
            const next = [...prev];
            const lastIndex = next.length - 1;

            if (next[lastIndex]?.role === "assistant") {
              next[lastIndex] = {
                ...next[lastIndex],
                content: next[lastIndex].content + token,
              };
            }

            return next;
          });
        },
      );

      if (!streamedResponse.trim() && response) {
        setMessages((prev) => {
          const next = [...prev];
          const lastIndex = next.length - 1;

          if (next[lastIndex]?.role === "assistant") {
            next[lastIndex] = {
              ...next[lastIndex],
              content: response,
            };
          }

          return next;
        });
      }
    } catch (error) {
      setMessages((prev) => {
        const next = [...prev];
        const lastIndex = next.length - 1;

        if (next[lastIndex]?.role === "assistant") {
          next[lastIndex] = {
            ...next[lastIndex],
            content: "Error generating response",
          };
        }

        return next;
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
      style={{
        flex: 1,
        backgroundColor: "#f7f7f8",
      }}
    >
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 48,
          paddingBottom: 12,
          backgroundColor: "#ffffff",
          borderBottomWidth: 1,
          borderBottomColor: "#e5e5e5",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          {models.length === 0 ? (
            <Pressable
              onPress={() => router.push("/models")}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 8,
                backgroundColor: "#2563eb",
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontWeight: "600",
                  fontSize: 13,
                }}
              >
                Download Models
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setShowDropdown(true)}
              disabled={modelLoading}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 8,
                backgroundColor: "#f5f5f5",
                borderWidth: 1,
                borderColor: "#e5e5e5",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "500",
                  color: "#1a1a1a",
                  marginRight: 6,
                }}
              >
                {selectedModel ? selectedModel.name : "Select model"}
              </Text>
              <Text style={{ color: "#666", fontSize: 10 }}>
                <ArrowDown size={15} />
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              justifyContent: "flex-start",
              alignItems: "flex-end",
              paddingTop: 100,
              paddingHorizontal: 20,
            }}
          >
            <TouchableWithoutFeedback>
              <View
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 12,
                  width: 260,
                  maxHeight: 280,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 6,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: "#e5e5e5",
                }}
              >
                <View
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: "#f0f0f0",
                    backgroundColor: "#fafafa",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: "#1a1a1a",
                    }}
                  >
                    Models
                  </Text>
                </View>

                <FlatList
                  data={models}
                  keyExtractor={(item) => item.id}
                  ListEmptyComponent={<NoModel />}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => selectModel(item)}
                      style={({ pressed }) => ({
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor:
                          selectedModel?.id === item.id
                            ? "#f0f7ff"
                            : pressed
                              ? "#f5f5f5"
                              : "transparent",
                      })}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight:
                              selectedModel?.id === item.id ? "600" : "500",
                            color:
                              selectedModel?.id === item.id
                                ? "#0066cc"
                                : "#1a1a1a",
                          }}
                        >
                          {item ? item.name : "Select a model"}
                        </Text>
                      </View>
                      {selectedModel?.id === item.id && (
                        <Text style={{ color: "#0066cc", fontSize: 12 }}>
                          ✓
                        </Text>
                      )}
                    </Pressable>
                  )}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {messages.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 40,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "500",
              color: "#1a1a1a",
              marginBottom: 8,
            }}
          >
            {models.length === 0
              ? "Download a model to get started"
              : "Select a model to get started"}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#666",
              textAlign: "center",
            }}
          >
            {models.length === 0
              ? "Install a model from the Download Models button above to begin chatting"
              : "Choose a model from the dropdown above to begin chatting"}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={messagesListRef}
          data={messages}
          keyExtractor={(_, index) => index.toString()}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            messagesListRef.current?.scrollToEnd({ animated: true });
          }}
          style={{
            flex: 1,
            paddingHorizontal: 20,
            paddingTop: 20,
          }}
          contentContainerStyle={{
            paddingBottom: 12,
          }}
          renderItem={({ item }) => (
            <View
              style={{
                marginBottom: 16,
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 12,
                maxWidth: "85%",
                backgroundColor: item.role === "user" ? "#0066cc" : "#ffffff",
                alignSelf: item.role === "user" ? "flex-end" : "flex-start",
                borderWidth: item.role === "assistant" ? 1 : 0,
                borderColor: "#e5e5e5",
              }}
            >
              <Text
                style={{
                  color: item.role === "user" ? "#ffffff" : "#1a1a1a",
                  fontSize: 15,
                  lineHeight: 22,
                }}
              >
                {item.content || "Thinking..."}
              </Text>
            </View>
          )}
        />
      )}

      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: 20,
          paddingTop: 8,
          backgroundColor: "#f7f7f8",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            backgroundColor: "#ffffff",
            borderWidth: 1,
            borderColor: "#e5e5e5",
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={
              modelLoading
                ? "Loading model..."
                : !selectedModel
                  ? "Select a model first..."
                  : "Send a message..."
            }
            placeholderTextColor="#999"
            style={{
              flex: 1,
              fontSize: 15,
              color: "#1a1a1a",
              paddingVertical: 8,
              paddingRight: 12,
              maxHeight: 120,
            }}
            multiline
            editable={!!selectedModel && !modelLoading && !loading}
            returnKeyType="send"
          />

          <Pressable
            onPress={sendMessage}
            disabled={
              !input.trim() || !selectedModel || modelLoading || loading
            }
            style={({ pressed }) => ({
              backgroundColor:
                !input.trim() || !selectedModel || modelLoading || loading
                  ? "#e5e5e5"
                  : pressed
                    ? "#0052a3"
                    : "#0066cc",
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 12,
              minWidth: modelLoading ? 124 : 60,
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <Text
              style={{
                color:
                  !input.trim() || !selectedModel || modelLoading || loading
                    ? "#999"
                    : "#ffffff",
                fontWeight: "600",
                fontSize: 14,
              }}
            >
              {modelLoading ? "Loading model..." : "Send"}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

export function NoModel() {
  return (
    <Link
      href="/models"
      style={{
        padding: 10,
        textDecorationLine: "underline",
        textAlign: "center",
      }}
    >
      Download Models
    </Link>
  );
}
