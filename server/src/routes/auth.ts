import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { Router } from "express";

import { connectToDatabase } from "../lib/db";
import { clearAuthCookie, setAuthCookie, signAuthToken } from "../lib/jwt";
import { requireAuth } from "../middleware/auth";
import { User, type UserRole, toSafeUser } from "../models/User";

const authRouter = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES: UserRole[] = ["admin", "student", "teacher"];

function parseRegisterBody(body: unknown) {
  const payload = (body ?? {}) as Record<string, unknown>;

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const password = typeof payload.password === "string" ? payload.password : "";
  const requestedRole = payload.role;
  const role: UserRole =
    typeof requestedRole === "string" && VALID_ROLES.includes(requestedRole as UserRole)
      ? (requestedRole as UserRole)
      : "student";

  return { name, email, password, role };
}

function parseLoginBody(body: unknown) {
  const payload = (body ?? {}) as Record<string, unknown>;
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const password = typeof payload.password === "string" ? payload.password : "";
  return { email, password };
}

function parseDevLoginBody(body: unknown): { role: "student" | "teacher" | null } {
  const payload = (body ?? {}) as Record<string, unknown>;
  const role = payload.role;
  if (role === "student" || role === "teacher") {
    return { role };
  }
  return { role: null };
}

function getDemoUserProfile(role: "student" | "teacher") {
  if (role === "student") {
    return {
      email: "demo.student@projectguard.ai",
      name: "Demo Student",
      role,
    } as const;
  }

  return {
    email: "demo.teacher@projectguard.ai",
    name: "Demo Teacher",
    role,
  } as const;
}

function generateStrongRandomPassword() {
  return `Demo-${randomBytes(24).toString("base64url")}-A1!`;
}

authRouter.post("/register", async (request, response) => {
  await connectToDatabase();

  const { name, email, password, role } = parseRegisterBody(request.body);

  if (!name || name.length < 2) {
    response.status(400).json({ message: "Name must be at least 2 characters." });
    return;
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    response.status(400).json({ message: "A valid email is required." });
    return;
  }

  if (!password || password.length < 8) {
    response.status(400).json({ message: "Password must be at least 8 characters." });
    return;
  }

  const existingUser = await User.findOne({ email }).exec();
  if (existingUser) {
    response.status(409).json({ message: "Email is already in use." });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
  });

  const token = signAuthToken({
    userId: String(user._id),
    role: user.role,
  });

  setAuthCookie(response, token);
  response.status(201).json({ user: toSafeUser(user) });
});

authRouter.post("/login", async (request, response) => {
  await connectToDatabase();

  const { email, password } = parseLoginBody(request.body);

  if (!email || !password) {
    response.status(400).json({ message: "Email and password are required." });
    return;
  }

  const user = await User.findOne({ email }).exec();
  if (!user) {
    response.status(401).json({ message: "Invalid email or password." });
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    response.status(401).json({ message: "Invalid email or password." });
    return;
  }

  const token = signAuthToken({
    userId: String(user._id),
    role: user.role,
  });

  setAuthCookie(response, token);
  response.status(200).json({ user: toSafeUser(user) });
});

authRouter.post("/logout", (_request, response) => {
  clearAuthCookie(response);
  response.status(200).json({ message: "Logged out." });
});

authRouter.post("/dev-login", async (request, response) => {
  const runtimeEnv = process.env.NODE_ENV ?? "development";
  if (runtimeEnv !== "development") {
    response.status(404).json({ message: "Not found." });
    return;
  }

  await connectToDatabase();

  const { role } = parseDevLoginBody(request.body);
  if (!role) {
    response.status(400).json({ message: "role must be student or teacher." });
    return;
  }

  const demoProfile = getDemoUserProfile(role);
  let user = await User.findOne({ email: demoProfile.email }).exec();

  if (!user) {
    const hashedPassword = await bcrypt.hash(generateStrongRandomPassword(), 12);
    user = await User.create({
      name: demoProfile.name,
      email: demoProfile.email,
      password: hashedPassword,
      role: demoProfile.role,
    });
  } else if (user.role !== demoProfile.role || user.name !== demoProfile.name) {
    user.role = demoProfile.role;
    user.name = demoProfile.name;
    await user.save();
  }

  const token = signAuthToken({
    userId: String(user._id),
    role: user.role,
  });

  setAuthCookie(response, token);
  response.status(200).json({ user: toSafeUser(user) });
});

authRouter.get("/me", requireAuth, async (request, response) => {
  await connectToDatabase();

  if (!request.user) {
    response.status(401).json({ message: "Authentication required." });
    return;
  }

  const user = await User.findById(request.user.userId).exec();
  if (!user) {
    response.status(404).json({ message: "User not found." });
    return;
  }

  response.status(200).json({ user: toSafeUser(user) });
});

export default authRouter;
