import { Router } from "express";

import { requireAuth, requireRole } from "../middleware/auth";

const protectedRouter = Router();

protectedRouter.get(
  "/student/ping",
  requireAuth,
  requireRole(["student", "admin"]),
  (request, response) => {
    response.status(200).json({
      message: "Student route accessible.",
      user: request.user,
    });
  },
);

protectedRouter.get("/admin/ping", requireAuth, requireRole(["admin"]), (request, response) => {
  response.status(200).json({
    message: "Admin route accessible.",
    user: request.user,
  });
});

protectedRouter.get(
  "/teacher/ping",
  requireAuth,
  requireRole(["teacher", "admin"]),
  (request, response) => {
    response.status(200).json({
      message: "Teacher route accessible.",
      user: request.user,
    });
  },
);

export default protectedRouter;
