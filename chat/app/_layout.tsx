import { initializeDatabase } from "@/db/client";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Sidebar from "@/components/sidebar";

export default function RootLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    initializeDatabase()
      .then(() => {
        console.log("Database initialized");
      })
      .catch(console.error);
  }, []);

  return (
    <>
      <StatusBar style="dark" />

      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="models" />
        <Stack.Screen name="settings" />
      </Stack>

      <SafeAreaView style={styles.menuButtonWrapper} pointerEvents="box-none">
        <Pressable
          onPress={() => setSidebarOpen(true)}
          style={styles.menuButton}
          hitSlop={8}
        >
          <Ionicons name="menu-outline" size={35} color="#000" />
        </Pressable>
      </SafeAreaView>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  menuButtonWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  menuButton: {
    marginTop: 8,
    marginLeft: 12,
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
