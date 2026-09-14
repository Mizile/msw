import express, { Request, Response } from "express";
import { users, User } from "./data";
const { config } = require("dotenv");
config();

// Convert to number, falling back to 3000 if it's undefined or NaN
const port = Number(process.env.SERVER_PORT) || 3000;
const ip_address = process.env.SERVER_IP || "0.0.0.0";

const app = express();
app.use(express.json());

// GET /users
app.get("/users", (_req: Request, res: Response) => {
  res.json(users);
});

// GET /users/:id
app.get("/users/:id", (req: Request, res: Response) => {
  const user = users.find((u) => u.id === Number(req.params.id));
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.json(user);
});

// POST /users
app.post("/users", (req: Request, res: Response) => {
  const { name, email, role } = req.body as Omit<User, "id">;
  const newUser: User = { id: users.length + 1, name, email, role };
  users.push(newUser);
  res.status(201).json(newUser);
});

app.listen(port, ip_address, () =>
  console.log(`Backend running on http://${ip_address}:${port}`),
);
