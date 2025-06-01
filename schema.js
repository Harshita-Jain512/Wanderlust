const Joi = require('joi');
module.exports.listingSchema = Joi.object({
    listing: Joi.object({
        title: Joi.string(). required(),
        description: Joi.string(). required(),
        location: Joi.string(). required(),
        country: Joi.string(). required(),
        price: Joi.number(). required().min(0),
        image: Joi.string().allow("", null),
        phone: Joi.string()
        .required()
        .pattern(/^\+?[1-9]\d{1,14}$/)
        .message("Please enter a valid phone number"),
    }). required()
})
module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        comment: Joi.string().required(),
    }).required(),
});