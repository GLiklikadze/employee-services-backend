import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import crypto from "crypto";
import db from "./db.js";

const app = express();
app.use(express.json());
app.use(cors());

// --- Your routes (copy everything from your snippet) ---
app.get("/users", (req, res) => {
  const users = db.data.users;
  res.json(users);
});

app.get("/users/:id", (req, res) => {
  const user = db.data.users?.find((user) => user._id === req.params.id);

  if (!user) return res.status(404).json({ message: "User not found" });

  res.json(user);
});

// ... keep all your POST, PATCH, PUT routes ...

// Export Express app as default (Vercel expects this)
export default app;
