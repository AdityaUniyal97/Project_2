import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";

import authRouter from "./routes/auth";
import protectedRouter from "./routes/protected";
import reviewRouter from "./routes/review";
import submissionsRouter from "./routes/submissions";
import teacherRouter from "./routes/teacher";

const app = express();

const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_request, response) => {
  response.status(200).json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api", protectedRouter);
app.use("/api/submissions", submissionsRouter);
app.use("/api/review", reviewRouter);
app.use("/api/teacher", teacherRouter);

app.use((_request, response) => {
  response.status(404).json({ message: "Route not found." });
});

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  const message = error instanceof Error ? error.message : "Internal server error.";
  console.error("[server:error]", error);
  response.status(500).json({ message });
});

export default app;
