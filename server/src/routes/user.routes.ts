import { Router } from "express";
import {
  updateUser,
  deleteUser,
  getUserById,
  searchUsers,
} from "../controllers/user.controller";

const userRouter = Router();

userRouter.get("/search", searchUsers);
userRouter.patch("/", updateUser);
userRouter.delete("/", deleteUser);
userRouter.get("/:id", getUserById);

export default userRouter;
