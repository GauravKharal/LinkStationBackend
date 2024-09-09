import { Link } from "../models/link.model.js";
import { Station } from "../models/station.model.js";
import { LinkClick } from "../models/linkClick.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const incrementClicks = asyncHandler(async (req, res) => {
  const { linkId } = req.params;

  if (!linkId) {
    throw new ApiError(400, "Link ID not found");
  }

  const link = await Link.findById(linkId);
  if (!link) {
    throw new ApiError(404, "Link not found");
  }

  const today = new Date().setHours(0, 0, 0, 0);

  const linkClick = await LinkClick.findOne({
    link: link._id,
    date: today,
  });

  if (!linkClick) {
    await LinkClick.create({
      link: link._id,
      date: today,
      clicks: 1,
    });
  } else {
    await LinkClick.findByIdAndUpdate(linkClick._id, {
      $inc: { clicks: 1 },
    });
  }

  const linkClicks = await LinkClick.find({ link: link._id });

  const totalClicks = linkClicks.reduce((total, linkClick) => {
    return total + linkClick.clicks;
  }, 0);

  link.clicks = totalClicks;
  link.save();

  const station = await Station.findById(link.station);
  if (!station) {
    throw new ApiError(404, "Station not found");
  }

  const links = await Link.find({ station: station._id });
  if (!links?.length) {
    throw new ApiError(404, "Links not found");
  }

  const stationClicks = links.reduce((total, link) => {
    return total + link.clicks;
  }, 0);

  station.clicks = stationClicks;
  station.save();



  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Link Clicks Incremented"));
});

export { incrementClicks };
