import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import crypto from "crypto";

const app = express();
app.use(express.json());
app.use(cors());

// -------------------- In-memory storage --------------------
const users = [
  {
    _id: "1",
    email: "admin@example.com",
    password: "$2b$10$e0MYzXyjpJS7Pd0RVvHwHeFxZyNw1aUiMP0e0kO/5fOdU6d7AQmfe", // "password"
    address_book_role: "admin",
    hr_employee_list: []
  }
];

// -------------------- Root endpoint --------------------
app.get("/", (req, res) => {
  res.json({
    message: "Employee Services API",
    endpoints: [
      "GET /users",
      "GET /users/:id",
      "POST /sign-in",
      "POST /sign-up",
      "PATCH /settings",
      "PUT /edit/:id"
    ]
  });
});

// -------------------- GET /users --------------------
app.get("/users", (req, res) => {
  res.json(users);
});

// -------------------- GET /users/:id --------------------
app.get("/users/:id", (req, res) => {
  const user = users.find((u) => u._id === req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

// -------------------- POST /sign-in --------------------
app.post("/sign-in", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });

  const user = users.find((u) => u.email === email);
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: "Invalid credentials" });

  res.json({
    message: "Sign-in successful",
    token: user.password,
    email,
    id: user._id,
    role: user.address_book_role,
    hr_employee_list: user.hr_employee_list
  });
});

// -------------------- POST /sign-up --------------------
app.post("/sign-up", async (req, res) => {
  const { email, firstName, lastName, password } = req.body;
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const exists = users.find((u) => u.email === email);
  if (exists) return res.status(400).json({ message: "Email already registered" });

  const hashed = await bcrypt.hash(password, 10);
  const newUser = {
    _id: crypto.randomUUID(),
    email,
    password: hashed,
    first_name: firstName,
    last_name: lastName,
    address_book_role: "employee",
    hr_employee_list: []
  };

  users.push(newUser);
  res.status(201).json({ message: "User created", id: newUser._id, email });
});

// -------------------- PATCH /settings --------------------
app.patch("/settings", (req, res) => {
  const { addressBookRole, targetUserId, signedInUserId } = req.body;
  if (!addressBookRole || !targetUserId || !signedInUserId) {
    return res.status(400).json({ message: "role, targetUserId, and signedInUserId required" });
  }

  const signedInUser = users.find((u) => u._id === signedInUserId);
  const targetUser = users.find((u) => u._id === targetUserId);

  if (!signedInUser) return res.status(404).json({ message: "Signed-in user not found" });
  if (signedInUser._id === targetUserId) return res.status(400).json({ message: "Cannot change own role" });
  if (signedInUser.address_book_role !== "admin") return res.status(400).json({ message: "Only admin can change roles" });
  if (targetUser.address_book_role === addressBookRole) return res.status(400).json({ message: "Role already set" });

  targetUser.address_book_role = addressBookRole;
  res.json({ message: "Role updated", id: targetUserId, address_book_role: addressBookRole });
});

// -------------------- PUT /edit/:id --------------------
app.put("/edit/:id", (req, res) => {
  const { id } = req.params;
  const { updatedEmployee } = req.body;

  if (!updatedEmployee || typeof updatedEmployee !== "object") {
    return res.status(400).json({ message: "updatedEmployee object required" });
  }
