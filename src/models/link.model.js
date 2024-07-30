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
    },
    clicks: {
      type: Number,
    },
    color: {
      type: String,
      required: true,
    },
    position: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export const Link = mongoose.model("Link", linkSchema);
