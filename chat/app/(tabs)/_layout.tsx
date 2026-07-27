import { Tabs } from "expo-router";
import { MessageCircle, Cpu, Settings } from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#208AEF",
        tabBarStyle: {
          height: 60,
        },
      }}
    >
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => (
            <MessageCircle
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="models"
        options={{
          title: "Models",
          tabBarIcon: ({ color, size }) => (
            <Cpu
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Settings
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}