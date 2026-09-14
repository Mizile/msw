import Constants from "expo-constants";

const { serverIp, serverPort } = Constants.expoConfig?.extra ?? {};

const serverUrl = `http://${serverIp}:${serverPort}`;

export { serverIp, serverPort, serverUrl };
