import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { serverUrl } from "./config";

if (__DEV__ && process.env.NODE_ENV !== "test") {
  require("./src/mocks/polyfills");
  const { server } = require("./src/mocks/server");
  server.listen({
    onUnhandledRequest(request: Request) {
      if (request.url.includes(":8081")) return;
      console.warn(`[MSW] Unhandled: ${request.method} ${request.url}`);
    },
  });
  console.log("[MSW] Mock server started");
}

interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "member";
}

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${serverUrl}/users`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: User[]) => setUsers(data))
      .catch(() => setError("Failed to fetch users"))
      .finally(() => setLoading(false));
  }, []);

  const handleAddUser = () => {
    if (!name || !email) return;
    setAdding(true);
    setAddError(null);

    fetch(`${serverUrl}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, role: "member" }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to add user");
        return res.json();
      })
      .then((newUser: User) => {
        setUsers((prev) => [...prev, newUser]);
        setName("");
        setEmail("");
      })
      .catch(() => setAddError("Failed to add user"))
      .finally(() => setAdding(false));
  };

  if (loading)
    return (
      <ActivityIndicator testID="loading-indicator" style={styles.center} />
    );
  if (error) return <Text style={styles.center}>{error}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Directory</Text>

      {/* ── Add User Form ── */}
      <View style={styles.form}>
        <TextInput
          testID="input-name"
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          testID="input-email"
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
        />
        <TouchableOpacity
          testID="btn-add"
          style={styles.button}
          onPress={handleAddUser}
          disabled={adding}
        >
          <Text style={styles.buttonText}>
            {adding ? "Adding..." : "Add User"}
          </Text>
        </TouchableOpacity>
        {addError && (
          <Text testID="add-error" style={styles.errorText}>
            {addError}
          </Text>
        )}
      </View>

      <FlatList
        data={users}
        keyExtractor={(u) => String(u.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>
              {item.email} · {item.role}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  form: { marginBottom: 20, gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 10,
  },
  button: {
    backgroundColor: "#3b82f6",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  errorText: { color: "#ef4444", fontSize: 13 },
  card: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
  },
  name: { fontSize: 16, fontWeight: "600" },
  meta: { fontSize: 13, color: "#64748b", marginTop: 4 },
});
