const mongoose = require('mongoose');
const { default: slugify } = require('slugify');
const User = require('./userModel');
// const Review = require('./reviewModel');

const tourSchema = new mongoose.Schema({
    name:{
        type: String,
        required:true,
        unique: true
    },
    duration: {
        type: Number,
        required: true
    },
    maxGroupSize: {
        type: Number,
        required: [true,'Max Group size is required 😞😞😞😒 ']
    },
    difficulty: {
        type: String,
        required: true
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: true
    },
    summary: {
        type: String,
        trim: true,
        required: true
    },
    description:{
        type: String,
        trim: true
    },
    imageCover:{
        type: String,
        required: true
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
        // To hide this field
        select: false
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    },
    startLocation:{
        // GeoJSON
        type:{
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations:[
        {
            type:{
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],
    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User' 
        }
    ]
},
{
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});


tourSchema.index({price : 1, ratingsAverage : -1});
tourSchema.index({slug : 1});
tourSchema.index({ startLocation: '2dsphere' });


tourSchema.virtual('durationsInWeek').get(function(){
    return this.duration / 7;
})

tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
});


tourSchema.pre('save',async function(next) {
    const guidePromises = this.guides.map(async id => await User.findById(id));
    this.guides = await Promise.all(guidePromises);
    next();
});



tourSchema.pre(/^find/,function(next){
    this.find({secretTour: {$ne: true}});
    next();
})

tourSchema.pre(/^find/,function(next){
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    });
    next();
})

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
