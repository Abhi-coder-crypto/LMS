// server/models/User.ts
import mongoose from "../db";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "admin", "instructor"], default: "student" },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;
