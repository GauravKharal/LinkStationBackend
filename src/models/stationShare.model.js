import mongoose, { Schema } from "mongoose";

const stationShareSchema = new Schema(
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
    shares: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const StationShare = mongoose.model("StationShare", stationShareSchema)