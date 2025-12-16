import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { readData, writeData } from "./employee-data.json";

const app = express();
app.use(express.json());
app.use(cors());

// -------------------- Root --------------------
app.get("/", async (req, res) => {
  res.json({ message: "Employee Services API" });
});

// -------------------- GET /users --------------------
app.get("/users", async (req, res) => {
  const db = await readData();
  res.json(db.users);
});

// -------------------- GET /users/:id --------------------
app.get("/users/:id", async (req, res) => {
  const db = await readData();
  const user = db.users.find((u) => u._id === req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

// -------------------- POST /sign-up --------------------
app.post("/sign-up", async (req, res) => {
  try {
    const { email, firstName, lastName, password } = req.body;
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: "All fields required" });
    }

    const db = await readData();
    if (db.users.find((u) => u.email === email)) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const newUser = {
      _id: crypto.randomUUID(),
      email,
      password: hashed,
      first_name: firstName,
      last_name: lastName,
      address_book_role: "employee",
      hr_employee_list: [],
    };

    db.users.push(newUser);
    await writeData(db);

    res.status(201).json({ message: "User created", id: newUser._id, email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// -------------------- PATCH /settings --------------------
app.patch("/settings", async (req, res) => {
  try {
    const { addressBookRole, targetUserId, signedInUserId } = req.body;
    if (!addressBookRole || !targetUserId || !signedInUserId) {
      return res.status(400).json({ message: "All fields required" });
    }

    const db = await readData();
    const signedInUser = db.users.find((u) => u._id === signedInUserId);
    const targetUser = db.users.find((u) => u._id === targetUserId);

    if (!signedInUser)
      return res.status(404).json({ message: "Signed-in user not found" });
    if (signedInUser._id === targetUserId)
      return res.status(400).json({ message: "Cannot change own role" });
    if (signedInUser.address_book_role !== "admin")
      return res.status(400).json({ message: "Only admin can change roles" });
    if (targetUser.address_book_role === addressBookRole)
      return res.status(400).json({ message: "Role already set" });

    targetUser.address_book_role = addressBookRole;
    await writeData(db);

    res.json({
      message: "Role updated",
      id: targetUserId,
      address_book_role: addressBookRole,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// -------------------- PUT /edit/:id --------------------
app.put("/edit/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { updatedEmployee } = req.body;

    if (!updatedEmployee || typeof updatedEmployee !== "object") {
      return res
        .status(400)
        .json({ message: "updatedEmployee object required" });
    }

    const db = await readData();
    const targetUser = db.users.find((u) => u._id === id);
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    Object.assign(targetUser, updatedEmployee);
    await writeData(db);

    res.json({ message: "User updated", id, updatedUser: targetUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default app;
