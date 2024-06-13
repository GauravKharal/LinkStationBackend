import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const stationSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    url: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    views: {
      type: Number,
      default: 0,
    },
    visibility: {
      type: Boolean,
      default: true,
    },
    icon: {
      type: String,
      required: true,
    },
    theme: {
      type: Schema.Types.ObjectId,
      ref: "Theme",
    },
  },
  { timestamps: true }
);

stationSchema.plugin(mongooseAggregatePaginate);

export const Station = mongoose.model("Station", stationSchema);
