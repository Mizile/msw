import "dotenv/config";
import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "frontend",
  slug: "frontend",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  assetBundlePatterns: ["**/*"],
  ios: { supportsTablet: true },
  web: { favicon: "./assets/favicon.png" },
  extra: {
    serverIp: process.env.EXPO_PUBLIC_SERVER_IP,
    serverPort: process.env.EXPO_PUBLIC_SERVER_PORT,
  },
});
