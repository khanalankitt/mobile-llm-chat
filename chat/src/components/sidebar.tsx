import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  BackHandler,
  Dimensions,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, usePathname } from "expo-router";
import {
  deleteConversation,
  getConversations,
  type Conversation,
} from "@/services/conversationRepo";

const SIDEBAR_WIDTH = Math.min(280, Dimensions.get("window").width * 0.78);
const CLOSE_DISTANCE_THRESHOLD = SIDEBAR_WIDTH * 0.3;
const CLOSE_VELOCITY_THRESHOLD = 0.5;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const openRef = useRef(open);
  openRef.current = open;

  const [conversations, setConversations] = useState<Conversation[]>([]);

  const refreshConversations = useCallback(async () => {
    const data = await getConversations();
    setConversations(data);
  }, []);

  useEffect(() => {
    if (open) {
      refreshConversations();
    }
  }, [open, refreshConversations]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: open ? 0 : -SIDEBAR_WIDTH,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: open ? 1 : 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, [open]);

  useEffect(() => {
    if (openRef.current) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [open, onClose]);

  const handleNewChat = () => {
    onClose();
    router.push("/chat/new");
  };

  const handleOpenConversation = (id: string) => {
    onClose();
    router.push(`/chat/${id}`);
  };

  const handleOpenModels = () => {
    onClose();
    router.push("/models");
  };

  const handleDeleteConversation = (item: Conversation) => {
    Alert.alert(
      "Delete chat?",
      `"${item.title}" will be permanently deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteConversation(item.id);
            await refreshConversations();

            if (pathname === `/chat/${item.id}`) {
              router.replace("/chat/new");
            }
          },
        },
      ],
    );
  };

  const isChatActive = pathname.startsWith("/chat/");
  const isNewChatActive = pathname === "/chat/new" || pathname === "/";
  const isModelsActive = pathname === "/models";

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        gesture.dx < -8 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: (_evt, gesture) => {
        const next = Math.max(-SIDEBAR_WIDTH, Math.min(0, gesture.dx));
        translateX.setValue(next);
        overlayOpacity.setValue(1 - Math.abs(next) / SIDEBAR_WIDTH);
      },
      onPanResponderRelease: (_evt, gesture) => {
        const shouldClose =
          gesture.dx < -CLOSE_DISTANCE_THRESHOLD ||
          gesture.vx < -CLOSE_VELOCITY_THRESHOLD;
        if (shouldClose) {
          onClose();
        } else {
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(overlayOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(overlayOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      },
    }),
  ).current;

  return (
    <>
      <Animated.View
        style={[styles.overlay, { opacity: overlayOpacity }]}
        pointerEvents={open ? "auto" : "none"}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.sidebar,
          { width: SIDEBAR_WIDTH, transform: [{ translateX }] },
        ]}
      >
        <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>ChatJPT</Text>
          </View>

          {/* New chat */}
          <View style={styles.newChatWrapper}>
            <TouchableOpacity
              onPress={handleNewChat}
              activeOpacity={0.7}
              style={[
                styles.newChatButton,
                isNewChatActive && !isChatActive && styles.navItemActive,
              ]}
            >
              <Ionicons name="add-circle-outline" size={20} color="#2563eb" />
              <Text style={styles.newChatLabel}>New chat</Text>
            </TouchableOpacity>
          </View>

          {/* Conversation list */}
          <View style={styles.listSection}>
            {conversations.length > 0 && (
              <Text style={styles.sectionLabel}>Recent</Text>
            )}

            <Animated.ScrollView
              style={styles.list}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {conversations.map((item) => {
                const isActive = pathname === `/chat/${item.id}`;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleOpenConversation(item.id)}
                    onLongPress={() => handleDeleteConversation(item)}
                    activeOpacity={0.7}
                    style={[styles.chatItem, isActive && styles.navItemActive]}
                  >
                    <Ionicons
                      name="chatbubble-outline"
                      size={17}
                      color={isActive ? "#2563eb" : "#6b7280"}
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.chatLabel,
                        isActive && styles.navLabelActive,
                      ]}
                    >
                      {item.title}
                    </Text>
                    <Pressable
                      hitSlop={8}
                      onPress={() => handleDeleteConversation(item)}
                      style={styles.deleteButton}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={15}
                        color="#9ca3af"
                      />
                    </Pressable>
                  </TouchableOpacity>
                );
              })}

              {conversations.length === 0 && (
                <Text style={styles.emptyText}>No conversations yet</Text>
              )}
            </Animated.ScrollView>
          </View>

          {/* Bottom nav */}
          <View style={styles.bottomNav}>
            <TouchableOpacity
              onPress={handleOpenModels}
              activeOpacity={0.7}
              style={[styles.navItem, isModelsActive && styles.navItemActive]}
            >
              <Ionicons
                name="hardware-chip-outline"
                size={20}
                color={isModelsActive ? "#2563eb" : "#6b7280"}
              />
              <Text
                style={[
                  styles.navLabel,
                  isModelsActive && styles.navLabelActive,
                ]}
              >
                Models
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>v1.0.0</Text>
          </View>
        </SafeAreaView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(17,24,39,0.25)",
    zIndex: 10,
  },
  sidebar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "#ffffff",
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "#e5e7eb",
    zIndex: 20,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#111827",
  },
  newChatWrapper: {
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 8,
  },
  newChatButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  newChatLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563eb",
  },
  listSection: {
    flex: 1,
    paddingHorizontal: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  list: {
    flex: 1,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    marginBottom: 2,
  },
  chatLabel: {
    flex: 1,
    fontSize: 13.5,
    color: "#374151",
  },
  deleteButton: {
    padding: 4,
  },
  emptyText: {
    fontSize: 13,
    color: "#9ca3af",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bottomNav: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
    paddingHorizontal: 8,
    paddingTop: 8,
    gap: 4,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  navItemActive: {
    backgroundColor: "#eff6ff",
  },
  navLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  navLabelActive: {
    color: "#1d4ed8",
    fontWeight: "700",
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  footerText: {
    fontSize: 12,
    color: "#9ca3af",
  },
});