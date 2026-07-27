import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
} from "react-native";

import { useEffect, useState } from "react";
import { getDownloadedModels } from "@/services/modelRepo";
import { generateResponse, loadModel } from "@/services/llamaService";
import { db } from "@/db/client";

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

  useEffect(() => {
    async function init() {
      const data: any = await getDownloadedModels();

      setModels(data);

      if (data.length) {
        setSelectedModel(data[0]);
      }
    }

    init();
  }, []);

  async function selectModel(model: Model) {
    setSelectedModel(model);

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
        padding: 20,
        paddingTop: 50,
      }}
    >
      <Text
        style={{
          fontSize: 26,
          fontWeight: "800",
        }}
      >
        Offline AI Chat
      </Text>

      <Text
        style={{
          marginTop: 15,
          fontWeight: "700",
        }}
      >
        Select Model
      </Text>

      <FlatList
        horizontal
        data={models}
        keyExtractor={(item) => item.id}
        style={{
          maxHeight: 70,
        }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => selectModel(item)}
            style={{
              padding: 12,
              marginRight: 10,
              borderRadius: 14,

              backgroundColor:
                selectedModel?.id === item.id ? "#208AEF" : "#eee",
            }}
          >
            <Text
              style={{
                color: selectedModel?.id === item.id ? "white" : "black",
              }}
            >
              {item.name}
            </Text>
          </Pressable>
        )}
      />

      <FlatList
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        style={{
          flex: 1,
          marginTop: 20,
        }}
        renderItem={({ item }) => (
          <View
            style={{
              marginBottom: 12,
              padding: 12,
              borderRadius: 14,

              backgroundColor: item.role === "user" ? "#208AEF" : "#eee",

              alignSelf: item.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <Text
              style={{
                color: item.role === "user" ? "white" : "black",
              }}
            >
              {item.content}
            </Text>
          </View>
        )}
      />

      {loading && <ActivityIndicator />}

      <View
        style={{
          flexDirection: "row",
          gap: 10,
        }}
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask something..."
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 15,
            padding: 14,
          }}
        />

        <Pressable
          onPress={sendMessage}
          style={{
            backgroundColor: "#208AEF",
            padding: 15,
            borderRadius: 15,
          }}
        >
          <Text
            style={{
              color: "white",
            }}
          >
            Send
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
