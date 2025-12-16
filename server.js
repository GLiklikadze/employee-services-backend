// server.js
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import crypto from "crypto";
import db from "./db.js"; // make sure db.js is Vercel-compatible

const app = express();
app.use(express.json());
app.use(cors());

// -------------------- GET /users --------------------
app.get("/users", (req, res) => {
  const users = db.data.users;
  res.json(users);
});

// -------------------- GET /users/:id --------------------
app.get("/users/:id", (req, res) => {
  const user = db.data.users?.find((user) => user._id === req.params.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json(user);
});

// -------------------- POST /sign-in --------------------
app.post("/sign-in", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  const userMatches = db.data.users.find((user) => user?.email === email);

  if (!userMatches) {
    return res
      .status(401)
      .json({ message: "Invalid credentials, Please try again" });
  }

  const passwordMatches = await bcrypt.compare(password, userMatches?.password);

  if (!passwordMatches) {
    return res
      .status(401)
      .json({ message: "Invalid credentials, Please try again" });
  }

  return res.json({
    message: "Sign-in successful",
    token: userMatches?.password,
    email,
    id: userMatches?._id,
    role: userMatches?.address_book_role,
    hr_employee_list: userMatches?.hr_employee_list,
  });
});

// -------------------- POST /sign-up --------------------
app.post("/sign-up", async (req, res) => {
  try {
    const { email, firstName, lastName, password } = req.body;
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        message: "Email, firstname, lastname and password are required",
      });
    }

    const emailAlreadyExists = db.data.users.find(
      (user) => user?.email === email
    );
    if (emailAlreadyExists) {
      return res.status(400).json({
        message: "Email is already registered, Please try another email",
      });
    }

    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    const randomId = crypto.randomUUID();
    const newUser = {
      _id: randomId,
      isRemoteWork: false,
      user_avatar: "",
      first_name: firstName,
      last_name: lastName,
      first_native_name: "",
      last_native_name: "",
      middle_native_name: "",
      department: "",
      building: "",
      room: "",
      date_birth: { year: "", month: "", day: "" },
      desk_number: "",
      manager: { id: "", first_name: "", last_name: "" },
      phone: "",
      email,
      password: hashedPassword,
      teams: "",
      cnumber: "",
      citizenship: "",
      visa: [],
      address_book_role: "employee",
      hr_employee_list: [],
    };

    db.data.users.push(newUser);
    await db.write();

    res.status(201).json({
      message: "User created successfully",
      id: randomId,
      email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// -------------------- PATCH /settings --------------------
app.patch("/settings", async (req, res) => {
  const { addressBookRole, targetUserId, signedInUserId } = req.body;

  if (!addressBookRole || !targetUserId || !signedInUserId) {
    return res.status(400).json({
      message: "role and target user id and signedInUserId is required",
    });
  }

  const signedInUser = db.data.users.find(
    (user) => user._id === signedInUserId
  );
  const targetUser = db.data.users.find((user) => user._id === targetUserId);

  if (signedInUserId === targetUserId) {
    return res.status(400).json({ message: "user cant change his roles" });
  }
  if (signedInUser?.address_book_role !== "admin") {
    return res
      .status(400)
      .json({ message: "employee and hr cant change user roles" });
  }
  if (targetUser?.address_book_role === addressBookRole) {
    return res.status(400).json({ message: "role is already chosen" });
  }
  if (!signedInUser) {
    return res.status(404).json({ message: "user not found" });
  }

  targetUser.address_book_role = addressBookRole;
  await db.write();

  res.json({
    message: "address_book_role updated successfully",
    id: targetUserId,
    address_book_role: addressBookRole,
  });
});

// -------------------- PUT /edit/:id --------------------
app.put("/edit/:id", async (req, res) => {
  const { id } = req.params;
  const { updatedEmployee } = req.body;

  if (!updatedEmployee || typeof updatedEmployee !== "object") {
    return res
      .status(400)
      .json({ message: "updatedEmployee object is required" });
  }

  const targetUser = db.data.users.find((user) => user?._id === id);
  if (!targetUser) {
    return res.status(404).json({ message: "user not found" });
  }

  Object.assign(targetUser, updatedEmployee);
  await db.write();

  res.json({
    message: "user updated successfully",
    id: targetUser?._id,
    updatedUser: targetUser,
  });
});

// -------------------- Export for Vercel --------------------
export default app;
