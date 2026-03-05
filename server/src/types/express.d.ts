declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: "admin" | "student" | "teacher";
      };
    }
  }
}

export {};
