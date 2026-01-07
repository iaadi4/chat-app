import { Router } from "express";
import {
  updateUser,
  deleteUser,
  getUserById,
} from "../controllers/user.controller";

const userRouter = Router();

userRouter.patch("/", updateUser);
userRouter.delete("/", deleteUser);
userRouter.get("/:id", getUserById);

export default userRouter;
