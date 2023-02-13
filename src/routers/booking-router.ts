import { findBooking, createBooking, changeRoomId } from "@/controllers";
import { Router } from "express";
import { authenticateToken } from "@/middlewares";

const bookingRouter = Router();

bookingRouter
  .all("/*", authenticateToken)
  .get("/", findBooking)
  .post("/", createBooking)
  .put("/:bookingId", changeRoomId)

export { bookingRouter };