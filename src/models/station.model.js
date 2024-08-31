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
    visibility: {
      type: Boolean,
      default: true,
    },
    image: {
      type: String,
      required: true,
    },
    instagram: {
      type: String,
    },
    twitter: {
      type: String,
    },
    facebook: {
      type: String,
    },
    youtube: {
      type: String,
    },
    views:{
      type: Number,
      default: 0,
    },
    clicks:{
      type: Number,
      default: 0,
    },
    shares:{
      type: Number,
      default: 0,
    }
  },
  { timestamps: true }
);

stationSchema.plugin(mongooseAggregatePaginate);

export const Station = mongoose.model("Station", stationSchema);
