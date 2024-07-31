import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Station } from "../models/station.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getStationPage = asyncHandler(async (req, res) => {
  try {
    const { url } = req.params;

    if (!url?.trim()) {
      throw new ApiError(400, "URL not found");
    }

    //Using MongoDB Aggregate Pipeline
    // const station = await Station.aggregate([
    //   {
    //     $match: {
    //       url: url?.toLowerCase(),
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "links",
    //       localField: "_id",
    //       foreignField: "station",
    //       as: "links",
    //       pipeline: [
    //         {
    //           $project: {
    //             url: 1,
    //             title: 1,
    //             image: 1,
    //             position: 1,
    //             color: 1,
    //           },
    //         },
    //       ],
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "users",
    //       localField: "owner",
    //       foreignField: "_id",
    //       as: "owner",
    //       pipeline: [
    //         {
    //           $project: {
    //             username: 1,
    //             fullName: 1,
    //           },
    //         },
    //       ],
    //     },
    //   },
    //   {
    //     $project: {
    //       _id: 0,
    //       $cond: {
    //         if: "$visibility",
    //         then: {
    //           $cond: {
    //             if: "$createdByVisibility",
    //             then: {
    //               owner: "$owner",
    //             },
    //           },
    //           url: "$url",
    //           title: "$title",
    //           description: "$description",
    //           image: "$image",
    //           links: "$links",
    //         },
    //       },
    //     },
    //   },
    // ]);

    const station = await Station.findOne({ url: url.toLowercase() })
      .select("-_id")
      .populate("links", "url title image position color")
      .populate("owner", "username fullname");

    if (!station?.length) {
      throw new ApiError(404, "Station does not Exist");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, station, "Station fetched successfully"));
  } catch (error) {
    throw new ApiError(504, "Error Fetching the Station");
  }
});

export { getStationPage };
