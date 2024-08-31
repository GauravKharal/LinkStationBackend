import mongoose, { Schema } from "mongoose";

const linkClickSchema = new Schema(
  {
    link: {
      type: Schema.Types.ObjectId,
      ref: "Link",
      required: true,
    },
    date: {
      type: Date,
      default: Date.now(),
      required: true,
    },
    clicks: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const LinkClick = mongoose.model("LinkClick", linkClickSchema);
