import { useEffect, useRef } from "react";
import {
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

type PageKey = "chat" | "models";

interface NavItem {
  key: PageKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: "/" | "/models";
}

const NAV_ITEMS: NavItem[] = [
  { key: "chat", label: "Chat", icon: "chatbubble-outline", href: "/" },
  {
    key: "models",
    label: "Models",
    icon: "hardware-chip-outline",
    href: "/models",
  },
];

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

  const handleNavigate = (item: NavItem) => {
    onClose();
    router.push(item.href);
  };

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
          // Snap back open.
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
            <Text
              style={{
                fontSize: 30,
                fontWeight: "900",
                color: "#fff",
              }}
            >
              ChatJPT{" "}
            </Text>
          </View>

          {/* Nav */}
          <View style={styles.nav}>
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => handleNavigate(item)}
                  activeOpacity={0.7}
                  style={[styles.navItem, isActive && styles.navItemActive]}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={isActive ? "#ffffff" : "#9ca3af"}
                  />
                  <Text
                    style={[styles.navLabel, isActive && styles.navLabelActive]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 10,
  },
  sidebar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "#0a0a0a",
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "#262626",
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
    paddingVertical: 16,
  },
  nav: {
    flex: 1,
    paddingHorizontal: 8,
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
    backgroundColor: "#262626",
  },
  navLabel: {
    fontSize: 14,
    color: "#9ca3af",
  },
  navLabelActive: {
    color: "#ffffff",
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#262626",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  footerText: {
    fontSize: 12,
    color: "#737373",
  },
});
