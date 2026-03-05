import type { Response } from "express";
import jwt from "jsonwebtoken";

import type { UserRole } from "../models/User";

export const AUTH_COOKIE_NAME = "projectguard_auth";

const TOKEN_EXPIRY = "7d";
const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface AuthTokenPayload {
  userId: string;
  role: UserRole;
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("Missing JWT_SECRET in environment.");
  }

  return secret;
}

export function signAuthToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: TOKEN_EXPIRY });
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
}

function getCookieBaseOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export function setAuthCookie(response: Response, token: string) {
  response.cookie(AUTH_COOKIE_NAME, token, {
    ...getCookieBaseOptions(),
    maxAge: TOKEN_MAX_AGE_MS,
  });
}

export function clearAuthCookie(response: Response) {
  response.clearCookie(AUTH_COOKIE_NAME, getCookieBaseOptions());
}
