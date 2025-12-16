import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import crypto from "crypto";

const app = express();
app.use(express.json());
app.use(cors());

let users = [
  {
    _id: "1",
    email: "admin@example.com",
    password: "$2b$10$e0MYzXyjpJS7Pd0RVvHwHeFxZyNw1aUiMP0e0kO/5fOdU6d7AQmfe",
    address_book_role: "admin",
    hr_employee_list: [],
  },
];

// Wrap async route handlers in try/catch
const asyncHandler = (fn) => (req, res) => {
  Promise.resolve(fn(req, res)).catch((err) => {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  });
};

// Root endpoint
app.get("/", (req, res) => {
  res.json({ message: "Employee Services API" });
});

// GET /users
app.get(
  "/users",
  asyncHandler(async (req, res) => {
    res.json(users);
  })
);

// POST /sign-up
app.post(
  "/sign-up",
  asyncHandler(async (req, res) => {
    const { email, firstName, lastName, password } = req.body;
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (users.find((u) => u.email === email)) {
      return res.status(400).json({ message: "Email already registered" });
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

    users.push(newUser);
    res.status(201).json({ message: "User created", id: newUser._id, email });
  })
);

// Default export for Vercel
export default app;
