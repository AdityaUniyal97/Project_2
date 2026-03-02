import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const userRoles = ["student", "teacher", "admin"] as const;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: userRoles, required: true, default: "student" },
    avatarUrl: { type: String },
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
);

export type UserDocument = InferSchemaType<typeof userSchema>;

const User = (mongoose.models.User as Model<UserDocument>) || mongoose.model<UserDocument>("User", userSchema);

export default User;
