const mongoose = require("mongoose");
const review = require("./review");
const Schema = mongoose.Schema;
const Review = require("./review.js")

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  image: {
    url: String,
    filename: String,
  },
  phone: {
    type: String, // Storing phone number as a string
    required: true, // Making phone number mandatory
    match: [/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number"], // Basic phone number validation
  },
  price: Number,
  location: String,
  country: String,
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    }
  ],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  /*geometry:{
    type: {
      type: String, // Don't do `{ location: { type: String } }`
      enum: ['Point'], // 'location.type' must be 'Point'
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },*/
  roomsAcAvailable: {
    type: Number,
    required: true,
    default: 5,
  },
  roomsNonAcAvailable: {
    type: Number,
    required: true,
    default: 5,
  },
  
});

// mongoose middle ware , whenever we are deleting the listing the all the comments related to listing will also be deleted automatically 
listingSchema.post("findOneAndDelete" , async (listing) => {
  if (listing){
    await Review.deleteMany({_id : {$in: listing.reviews}});
  }
})

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;