export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "member";
}

export const users: User[] = [
  { id: 1, name: "Alice Johnson", email: "alice@example.com", role: "admin" },
  { id: 2, name: "Bob Smith", email: "bob@example.com", role: "member" },
  { id: 3, name: "Carol White", email: "carol@example.com", role: "member" },
];
