import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { upload } from "../middlewares/multer.middleware.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user details(email, username, password) from frontend
  // validation - (not empty)
  // check if user already exists (username/email)
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { email, username, password } = req.body;

  if ([email, username, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUsername = await User.findOne({ username });
  const existingEmail = await User.findOne({ email });

  if (existingUsername) {
    throw new ApiError(409, "User with that username exists.");
  }
  if (existingEmail) {
    throw new ApiError(409, "User with that email exists.");
  }

  const user = await User.create({
    email,
    username,
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user.");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Created Successfully"));
});

export { registerUser };
