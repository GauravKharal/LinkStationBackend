import mongoose, { Schema } from "mongoose";

const linkSchema = new Schema(
  {
    station: {
      type: Schema.Types.ObjectId,
      ref: "Station",
    },
    url: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    position: {
      type: Number,
    },
  },
  { timestamps: true }
);

export const Link = mongoose.model("Link", linkSchema);
