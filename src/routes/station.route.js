import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createStation,
  getStationPage,
  getLatestPublishedStations,
  getMostViewedStations,
  getViewsByDate,
  searchStations,
  getMostPopularStationsThisWeek,
  getMyMostPopularStations,
  totalMonthlySummary,
  incrementShares,
} from "../controllers/station.controller.js";

const router = Router();

router.route("/s/:url").get(getStationPage);

router.route("/s/share/:stationId").get(incrementShares);


// Secure Routes (Require Users to be Logged In)
router.route("/create").post(
  verifyJWT,
  upload.fields([
    {
      name: "stationImage",
      maxCount: 1,
    },
    {
      name: "linkImages",
      maxCount: 10,
    },
  ]),
  createStation
);

router.route("/public").get(verifyJWT, getLatestPublishedStations);

router.route("/popular").get(verifyJWT, getMostViewedStations);

router.route("/total-views").get(verifyJWT, getViewsByDate);

router.route("/search").get(searchStations);

router.route("/popular-this-week").get(getMostPopularStationsThisWeek);

router.route("/my-popular").get(verifyJWT, getMyMostPopularStations);

router.route("/total-monthly-summary").get(verifyJWT, totalMonthlySummary);

export default router;
