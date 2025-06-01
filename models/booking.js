const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema(
  {
    listing: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    checkIn: Date,
    checkOut: Date,
    roomType: {
      type: String,
      enum: ["AC", "Non-AC"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Booked", "Canceled"],
      default: "Booked",
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;