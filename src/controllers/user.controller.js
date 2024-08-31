import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Otp } from "../models/otp.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { sendMail } from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {

  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error generating Refresh and Access Tokens.");
  }
};

const getRegisterOTP = asyncHandler(async (req, res) => {
  const { email, username } = req.body;

  if (!email || !username) {
    throw new ApiError(400, "Email and username are required.");
  }

  const existingEmail = await User.findOne({ email });

  const existingUsername = await User.findOne({ username });

  if (existingEmail) {
    throw new ApiError(401, "User with that email already exists.");
  }

  if (existingUsername) {
    throw new ApiError(402, "User with that username already exists.");
  }

  const otp = Math.floor(100000 + Math.random() * 900000);

  await Otp.create({
    email,
    otp,
  });

  const response = await sendMail(email, otp);
  console.log(response);

  res.status(200).json(new ApiResponse(200, [], "OTP sent successfully"));
});

const registerUser = asyncHandler(async (req, res) => {
  // get user details(email, username, password) from frontend
  // validation - (not empty)
  // check if user already exists (username/email)
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { email, username, password, otp } = req.body;

  if ([email, username, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  if (!otp) {
    throw new ApiError(401, "OTP is required.");
  }

  const existingOtp = await Otp.findOne({ email, otp });
  if (!existingOtp) {
    throw new ApiError(402, "Invalid OTP.");
  }
  if (
    existingOtp.otp !== otp ||
    existingOtp.createdAt + 5 * 60 * 1000 < Date.now()
  ) {
    await Otp.findByIdAndDelete(existingOtp._id);

    throw new ApiError(403, "OTP Expired.");
  }

  await Otp.findByIdAndDelete(existingOtp._id);

  const existingUsername = await User.findOne({ username });
  const existingEmail = await User.findOne({ email });

  if (existingUsername) {
    throw new ApiError(405, "User with that username exists.");
  }
  if (existingEmail) {
    throw new ApiError(406, "User with that email exists.");
  }

  const user = await User.create({
    email,
    username,
    password,
  });

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user.");
  }

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, {
      user: createdUser,
      accessToken,
      refreshToken
    }, "User Created Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // extract data from req.body
  // username or email login
  // find the user
  // check password
  // access and refresh token
  // send tokens in cookies

  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Username or Email is required.");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(402, "User does not exist.");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Incorrect Password.");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged In Successfully."
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw ApiError(401, "Invalid Refresh Token");
    }

    if (decodedToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token Refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid Old Password");
  }

  if (oldPassword === newPassword) {
    throw new ApiError(401, "Old and New Password cannot be same");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully"));
});

const getUserDetails = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id).select(
    "-password -refreshToken"
  );
  const data = {
    user: user,
  };
  return res
    .status(200)
    .json(new ApiResponse(200, data, "User Details Fetched Successfully"));
});

const updateUserDetails = asyncHandler(async (req, res) => {
  const { fullName, dateOfBirth } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        dateOfBirth,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account Details Updated Successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(401, "Error while Uploading Avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar Updates Successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getUserDetails,
  updateUserDetails,
  updateUserAvatar,
  getRegisterOTP,
};
