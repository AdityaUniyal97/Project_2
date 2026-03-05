import type { NextFunction, Request, Response } from "express";

import { AUTH_COOKIE_NAME, verifyAuthToken } from "../lib/jwt";
import type { UserRole } from "../models/User";

function getTokenFromRequest(request: Request) {
  const cookieToken = request.cookies?.[AUTH_COOKIE_NAME];
  if (typeof cookieToken === "string" && cookieToken.length > 0) {
    return cookieToken;
  }

  const authorizationHeader = request.header("authorization");
  if (authorizationHeader?.startsWith("Bearer ")) {
    return authorizationHeader.slice(7);
  }

  return null;
}

export function requireAuth(request: Request, response: Response, next: NextFunction) {
  const token = getTokenFromRequest(request);

  if (!token) {
    response.status(401).json({ message: "Authentication required." });
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    request.user = payload;
    next();
  } catch {
    response.status(401).json({ message: "Invalid or expired session." });
  }
}

export function requireRole(roles: UserRole[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!request.user) {
      response.status(401).json({ message: "Authentication required." });
      return;
    }

    if (!roles.includes(request.user.role)) {
      response.status(403).json({ message: "Access denied." });
      return;
    }

    next();
  };
}
