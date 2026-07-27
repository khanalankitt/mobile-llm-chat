import { initializeDatabase } from "@/db/client";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

export default function RootLayout() {
  useEffect(() => {
    initializeDatabase()
      .then(() => {
        console.log("Database initialized");
      })
      .catch(console.error);
  }, []);
  return (
    <>
      <StatusBar style="auto" />

      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="models" />
        <Stack.Screen name="settings" />
      </Stack>
    </>
  );
}
