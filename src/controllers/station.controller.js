import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Station } from "../models/station.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getStationPage = asyncHandler(async (req, res) => {
  const { url } = req.params;

  if (!url?.trim()) {
    throw new ApiError(400, "URL not found");
  }

  const station = await Station.aggregate([
    {
      $match: {
        url: url?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "links",
        localField: "_id",
        foreignField: "station",
        as: "links",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $project: {
        _id: 0,
        $cond: {
          if: "$visibility",
          then: {
            owner: {
              $cond: {
                if: "$createdByVisibility",
                then: {
                  username: "$owner.username",
                  fullName: "$owner.fullName",
                },
              },
            },
            url: "$url",
            title: "$title",
            description: "$description",
            image: "$image",
            links: {
              $map: {
                input: "$links",
                as: "link",
                in: {
                  url: "$$link.url",
                  title: "$$link.title",
                  image: "$$link.image",
                  position: "$$link.position",
                  color: "$$link.color",
                },
              },
            },
          },
        },
      },
    },
  ]);

  if (!station?.length) {
    throw new ApiError(404, "Station does not Exist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, station[0], "Station fetched successfully"));
});

export { getStationPage };
