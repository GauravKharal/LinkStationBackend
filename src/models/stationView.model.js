import mongoose, { Schema } from "mongoose";

const stationViewSchema = new Schema(
  {
    station: {
      type: Schema.Types.ObjectId,
      ref: "Station",
      required: true,
    },
    date: {
      type: Date,
      default: Date.now(),
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const StationView = mongoose.model("StationView", stationViewSchema);