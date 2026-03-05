import { Schema, model, models, type HydratedDocument, type Model } from "mongoose";

export type UserRole = "admin" | "student" | "teacher";

export interface UserSchemaType {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type UserDocument = HydratedDocument<UserSchemaType>;

const userSchema = new Schema<UserSchemaType>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "student", "teacher"],
      default: "student",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ email: 1 }, { unique: true });

export const User = (models.User as Model<UserSchemaType>) || model<UserSchemaType>("User", userSchema);

export function toSafeUser(user: Pick<UserDocument, "_id" | "name" | "email" | "role" | "createdAt" | "updatedAt">): SafeUser {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
