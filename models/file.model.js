const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    originalFileName: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    isFree: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);
//course-> one or more section-> one or more module/file
