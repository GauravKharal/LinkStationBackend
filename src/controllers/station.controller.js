import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Station } from "../models/station.model.js";
import { StationView } from "../models/stationView.model.js";
import { LinkClick } from "../models/linkClick.model.js";
import { StationShare } from "../models/stationShare.model.js";
import { Link } from "../models/link.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

const getStationPage = asyncHandler(async (req, res) => {
  const { url } = req.params;

  if (!url?.trim()) {
    throw new ApiError(400, "URL not found");
  }

  const urlCleaned = url.trim().toLowerCase();

  const station = await Station.findOne({ url: urlCleaned });

  if (!station) {
    throw new ApiError(404, "Station does not Exist");
  }

  const links = await Link.find({ station: station._id });

  if (!links?.length) {
    throw new ApiError(404, "Links not found");
  }

  const today = new Date().setHours(0, 0, 0, 0);

  const stationView = await StationView.findOne({
    station: station._id,
    date: today,
  });

  if (!stationView) {
    await StationView.create({
      station: station._id,
      date: today,
      views: 1,
    });
  } else {
    await StationView.findByIdAndUpdate(stationView._id, {
      $inc: { views: 1 },
    });
  }

  const stationViews = await StationView.find({ station: station._id });

  const totalViews = stationViews.reduce((total, stationView) => {
    return total + stationView.views;
  }, 0);

  station.views = totalViews;

  station.save();

  const data = {
    station: station,
    links: links,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Station fetched successfully"));
});

const incrementShares = asyncHandler(async (req, res) => {
  const { stationId } = req.params;
  const station = await Station.findById(stationId);
  if (!station) {
    throw new ApiError(404, "Station not found");
  }

  const stationShare = await StationShare.findOne({
    station: stationId,
    date: new Date().setHours(0, 0, 0, 0),
  });
  if (!stationShare) {
    await StationShare.create({
      station: stationId,
      date: new Date().setHours(0, 0, 0, 0),
      shares: 1,
    });
  } else {
    await StationShare.findByIdAndUpdate(stationShare._id, {
      $inc: { shares: 1 },
    });
  }

  const stationShares = await StationShare.find({ station: stationId });

  const totalShares = stationShares.reduce((total, stationShare) => {
    return total + stationShare.shares;
  }, 0);

  station.shares = totalShares;
  station.save();

});

const createStation = asyncHandler(async (req, res) => {
  // get station details from frontend
  // validation - (not empty)
  // check if station already exists
  // check for image
  // upload image in cloudinary
  // create station object - create entry in db with user id
  // check for station creation
  // get created station's id
  // get links details from frontend
  // validation - (not empty)
  // create link object - create entry in db with station id
  // check for link creation
  // return response

  console.log(req.body);

  // get station details from frontend
  const {
    stationUrl,
    stationTitle,
    stationDescription,
    visibility,
    instagram,
    twitter,
    facebook,
    youtube,
  } = req.body;

  console.log(stationUrl);

  // validation - (required fields not empty)
  if ([stationUrl, stationTitle].some((field) => !field?.trim())) {
    throw new ApiError(400, "URL or Title not found");
  }

  // check if station already exists
  const existingStation = await Station.findOne({
    url: stationUrl.toLowerCase(),
  });
  if (existingStation) {
    throw new ApiError(401, "Station with that URL already exists");
  }

  // check for image
  const stationImageLocalPath = req.files?.stationImage[0]?.path;
  if (!stationImageLocalPath) {
    throw new ApiError(402, "Station Image not found");
  }

  // upload image in cloudinary
  const stationImage = await uploadOnCloudinary(stationImageLocalPath);

  if (!stationImage) {
    throw new ApiError(403, "Error while Uploading Station Image");
  }

  const station = await Station.create({
    owner: req.user._id,
    url: stationUrl.toLowerCase(),
    title: stationTitle,
    description: stationDescription ? stationDescription : "",
    image: stationImage.url,
    visibility: visibility ? visibility : true,
    instagram: instagram ? instagram.toLowerCase() : "",
    twitter: twitter ? twitter.toLowerCase() : "",
    facebook: facebook ? facebook.toLowerCase() : "",
    youtube: youtube ? youtube.toLowerCase() : "",
  });

  const createdStation = await Station.findById(station._id);

  if (!createdStation) {
    throw new ApiError(404, "Error while Creating Station");
  }

  // get links details from frontend
  const { links } = req.body;
  if (!links) {
    throw new ApiError(405, "Links not found");
  }

  // link images local paths
  const linkImagesLocalPaths = req.files?.linkImages?.map(
    (linkImage) => linkImage.path
  );
  if (!linkImagesLocalPaths) {
    throw new ApiError(406, "Link Images not found");
  }

  // upload images in cloudinary
  const linkImages = await Promise.all(
    linkImagesLocalPaths.map((linkImageLocalPath) =>
      uploadOnCloudinary(linkImageLocalPath)
    )
  );
  if (!linkImages) {
    throw new ApiError(407, "Error while Uploading Link Images");
  }

  console.log(linkImages);

  // Ensure links.url and links.title are arrays
  const urls = Array.isArray(links.url) ? links.url : [links.url];
  const titles = Array.isArray(links.title) ? links.title : [links.title];

  // Now use the urls and titles arrays safely
  const link = await Link.insertMany(
    linkImages.map((linkImage, index) => ({
      station: createdStation._id,
      url: urls[index],
      title: titles[index],
      image: linkImage.url,
    }))
  );

  const createdLinks = await Link.find({
    _id: { $in: link.map((l) => l._id) },
  });

  if (!createdLinks) {
    throw new ApiError(408, "Error while Creating Links");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { station: createdStation, links: createdLinks },
        "Station Created Successfully"
      )
    );
});

const getLatestPublishedStations = asyncHandler(async (req, res) => {
  const { page = 1, size = 10 } = req.query;

  const stations = await Station.find({ owner: req.user._id })
    .sort({ createdAt: -1 })
    .skip((page - 1) * size)
    .limit(parseInt(size));

  const data = {
    stations: stations,
  };
  return res
    .status(200)
    .json(new ApiResponse(200, data, "Stations fetched successfully"));
});

const getMostViewedStations = asyncHandler(async (req, res) => {
  const { page = 1, size = 10 } = req.query;

  const stations = await Station.find({ owner: req.user._id })
    .sort({ views: -1 })
    .skip((page - 1) * size)
    .limit(parseInt(size));

  const data = {
    stations: stations,
  };
  return res
    .status(200)
    .json(new ApiResponse(200, data, "Stations fetched successfully"));
});

const getViewsByDate = asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;
  const date = new Date();
  date.setDate(date.getDate() - days);

  // Fetch station IDs for the logged-in user
  const stationIds = await Station.find({ owner: req.user._id }).select("_id");

  // Ensure stationIds are in an array of ObjectIds
  const stationIdsArray = stationIds.map((station) => station._id);

  if (!stationIdsArray.length) {
    throw new ApiError(404, "Stations not found");
  }

  // Aggregate views from StationView grouped by date
  const data = await StationView.aggregate([
    {
      $match: {
        station: {
          $in: stationIdsArray,
        },
        date: {
          $gte: date,
        },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          day: { $dayOfMonth: "$date" },
        },
        totalViews: { $sum: "$views" },
      },
    },
    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
        "_id.day": 1,
      },
    },
    {
      $project: {
        _id: 0,
        date: {
          $dateFromParts: {
            year: "$_id.year",
            month: "$_id.month",
            day: "$_id.day",
          },
        },
        totalViews: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Views fetched successfully"));
});

const searchStations = asyncHandler(async (req, res) => {
  const { query } = req.query;
  const stations = await Station.find({
    $or: [
      { title: { $regex: query, $options: "i" } },
      { url: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ],
  });
  return res
    .status(200)
    .json(new ApiResponse(200, stations, "Stations fetched successfully"));
});

const getMostPopularStationsThisWeek = asyncHandler(async (req, res) => {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  const stationViews = await StationView.aggregate([
    {
      $match: {
        date: {
          $gte: date,
        },
      },
    },
    {
      $group: {
        _id: "$station",
        totalViews: { $sum: "$views" },
      },
    },
    {
      $lookup: {
        from: "stations",
        localField: "_id",
        foreignField: "_id",
        as: "station",
      },
    },
    {
      $project: {
        _id: 0,
        station: 1,
        totalViews: 1,
      },
    },
    {
      $sort: {
        totalViews: -1,
      },
    },
    {
      $limit: 3,
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, stationViews, "Stations fetched successfully"));
});

const getMyMostPopularStations = asyncHandler(async (req, res) => {
  const date = new Date();
  date.setDate(date.getDate() - 28);
  const stations = await Station.find({ owner: req.user._id });
  const stationViews = await StationView.aggregate([
    {
      $match: {
        station: {
          $in: stations.map((station) => station._id),
        },
        date: {
          $gte: date,
        },
      },
    },
    {
      $group: {
        _id: "$station",
        totalViews: { $sum: "$views" },
      },
    },
    {
      $lookup: {
        from: "stations",
        localField: "_id",
        foreignField: "_id",
        as: "station",
      },
    },
    {
      $unwind: "$station",
    },
    {
      $project: {
        _id: 0,
        station: 1,
        totalViews: 1,
      },
    },
    {
      $sort: {
        totalViews: -1,
      },
    },
    {
      $limit: 3,
    },
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, stationViews, "Stations fetched successfully"));
});

const totalMonthlySummary = asyncHandler(async (req, res) => {
  const date = new Date();
  date.setDate(date.getDate() - 28);
  const stationViews = await StationView.aggregate([
    {
      $match: {
        date: {
          $gte: date,
        },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
        },
        totalViews: { $sum: "$views" },
      },
    },
    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
      },
    },
    {
      $group: {
        _id: null,
        totalViews: { $sum: "$totalViews" },
      },
    },
    {
      $project: {
        _id: 0,
        totalViews: 1,
      },
    },
  ]);

  const stationClicks = await LinkClick.aggregate([
    {
      $match: {
        date: {
          $gte: date,
        },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
        },
        totalClicks: { $sum: "$clicks" },
      },
    },
    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
      },
    },{
      $group: {
        _id: null,
        totalClicks: { $sum: "$totalClicks" },
      },
    },
    {
      $project: {
        _id: 0,
        totalClicks: 1,
      },
    },
  ]);

  const stationShares = await StationShare.aggregate([
    {
      $match: {
        date: {
          $gte: date,
        },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
        },
        totalShares: { $sum: "$shares" },
      },
    },
    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
      },
    },{
      $group: {
        _id: null,
        totalShares: { $sum: "$totalShares" },
      },
    },
    {
      $project: {
        _id: 0,
        totalShares: 1,
      },
    },
  ]);

  const { totalViews} = stationViews[0] || 0;
  const { totalClicks} = stationClicks[0] || 0;
  const { totalShares} = stationShares[0] || 0;

  const data = {
    totalViews: totalViews,
    totalClicks: totalClicks,
    totalShares: totalShares,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Stations fetched successfully"));
});

export {
  getStationPage,
  createStation,
  getLatestPublishedStations,
  getMostViewedStations,
  getViewsByDate,
  searchStations,
  getMostPopularStationsThisWeek,
  getMyMostPopularStations,
  totalMonthlySummary,
  incrementShares,
};
