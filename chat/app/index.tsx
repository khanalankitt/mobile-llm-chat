import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { useEffect, useState } from "react";
import { getDownloadedModels } from "@/services/modelRepo";
import { generateResponse, loadModel } from "@/services/llamaService";
import { ArrowDown } from "lucide-react-native";
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
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    async function init() {
      const data = (await getDownloadedModels()) as Model[];
      setModels(data);
    }

    init();
  }, []);

  async function selectModel(model: Model) {
    setSelectedModel(model);
    setShowDropdown(false);
    await loadModel(model.path);
  }

  async function sendMessage() {
    if (!input.trim() || !selectedModel) return;

    const userMessage: Message = {
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await generateResponse(input);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Error generating response",
        },
      ]);
    }

    setLoading(false);
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#f7f7f8",
      }}
    >
      {/* Header */}
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
          {/* Model Selector - Smaller and professional */}
          <Pressable
            onPress={() => setShowDropdown(true)}
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
        </View>
      </View>

      {/* Model Dropdown Modal */}
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

      {/* Main Content */}
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
            Select a model to get started
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#666",
              textAlign: "center",
            }}
          >
            Choose a model from the dropdown above to begin chatting
          </Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(_, index) => index.toString()}
          style={{
            flex: 1,
            paddingHorizontal: 20,
            paddingTop: 20,
          }}
          contentContainerStyle={{
            paddingBottom: 20,
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
                {item.content}
              </Text>
            </View>
          )}
        />
      )}

      {loading && (
        <View style={{ paddingVertical: 8, alignItems: "center" }}>
          <ActivityIndicator size="small" color="#0066cc" />
        </View>
      )}

      {/* Input Area - ChatGPT/Claude style with KeyboardAvoidingView */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 48}
      >
        <View
          style={{
            paddingHorizontal: 20,
            paddingBottom: 20,
            paddingTop: 8,
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
                !selectedModel ? `Select a model first...` : "Send a message..."
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
              editable={!!selectedModel}
              returnKeyType="send"
            />

            <Pressable
              onPress={sendMessage}
              disabled={!input.trim() || !selectedModel || loading}
              style={({ pressed }) => ({
                backgroundColor:
                  !input.trim() || !selectedModel || loading
                    ? "#e5e5e5"
                    : pressed
                      ? "#0052a3"
                      : "#0066cc",
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 12,
                minWidth: 60,
                alignItems: "center",
                justifyContent: "center",
              })}
            >
              <Text
                style={{
                  color:
                    !input.trim() || !selectedModel || loading
                      ? "#999"
                      : "#ffffff",
                  fontWeight: "600",
                  fontSize: 14,
                }}
              >
                Send
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
