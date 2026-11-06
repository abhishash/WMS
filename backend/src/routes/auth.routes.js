// import express from "express";
// import {
//   forgotPassword,
//   getProfile,
//   loginUser,
//   registerUser,
//   resetPassword,
// } from "../controllers/authController.js";
// // import { authMiddleware } from "../middleware/authMiddleware.js";
// import asyncHandler from "../middleware/asyncHandler.js";

// const router = express.Router();

// router.post("/register", asyncHandler(registerUser));
// router.post("/login", asyncHandler(loginUser));
// router.post("/forgot-password", asyncHandler(forgotPassword));
// router.post("/forget-passowrd", asyncHandler(forgotPassword));
// router.post("/reset-password/:token", asyncHandler(resetPassword));
// router.get(
//   "/profile",
//   // authMiddleware,
//   asyncHandler(getProfile),
// );

// export default router;


import express from "express";

import { register, login, getMe } from "../controllers/auth.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.get("/me", protect, getMe);

export default router;
