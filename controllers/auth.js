import jwt from "jsonwebtoken";
import { User } from "../db/models/user.js";
import bcrypt from "bcrypt";

import { MIN_PASSWORD_LENGTH } from "../config/security.js";

if (String(password).length < MIN_PASSWORD_LENGTH) {
  return res.status(400).json({
    error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
  });
}

export async function register(req, res) {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });

  if (password.length < MIN_PASSWORD_LENGTH)
    return res.status(400).json({ error: "Password is too short" });

  try {
    const exists = await User.findOne({ where: { email } });
    if (exists)
      return res.status(409).json({ error: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({ email, password: hash });

    res.status(201).json({ id: user.id, email: user.email });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(400).json({ error: "Invalid email or password" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ error: "Invalid email or password" });

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token });
}
