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
    // Geo Spatial Data is basically that data which describes palces on earth using longitude and latitude
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
    // guides: Array (Entire object will come)
    guides: [//(Here only ObjectId will come only objectId is defined)
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User' // This refarence will help when we will be populating in User Database This refarence will help to establish connection connection between User and Tour datasets
        }
    ]
},
// To enable virtual properties.
{
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});


// Indexing 
// tourSchema.index({price : 1});
tourSchema.index({price : 1, ratingsAverage : -1});
tourSchema.index({slug : 1});
tourSchema.index({ startLocation: '2dsphere' });

// Virtual properties to convert data Example Days to week.This manipulate data will not be stroed in database.
// For more information see https://www.geeksforgeeks.org/mongoose-virtuals/

tourSchema.virtual('durationsInWeek').get(function(){
    // Here we have to use regular function because only regular function supports 'this' keyword
    return this.duration / 7;
})

// Virtual populate
// ref: Specifies the model name of the referenced collection. In this case, it's 'Review', which means the virtual property will be populated with documents from the Review collection.
// foreignField: Specifies the name of the field in the referenced collection that should match the _id field of the current schema. In this case, it's 'tour', which means the Review documents must have a tour field that matches the _id field of the tourSchema document.
// localField: Specifies the name of the field in the current schema that should match the foreignField in the referenced collection. In this case, it's '_id', which means the '_id' field of the tourSchema document should match the tour field of the Review documents.

tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
});


//* DOCUMENT MIDDLEWARE
//! pre is a DOCUMENT MIDDLEWARE. This middleware run before .save() .create() But not on insertMany() */ 
// This middleware Basically find all data from User schema of given ID and save data in guides fields
tourSchema.pre('save',async function(next) {
    // Map all data store in an array. Here User.findById(id) return promise. So guidePromises will be array of promises.
    const guidePromises = this.guides.map(async id => await User.findById(id));
    // When all promises of array are resolved,Then a Promise will be resolved
    this.guides = await Promise.all(guidePromises);
    next();
});


//* QUERY MIDDLEWARE
//! Here we are processing on query not document
// This middleware helps to populating the data. When find query will be triggered then first this middleware will populates the data.
// If we write only 'find' then it only runs we want to all data. But when query form findOne then it not works then here we use RegEx to handle the case.

tourSchema.pre(/^find/,function(next){
    this.find({secretTour: {$ne: true}});
    // console.log("hi");
    next();
})

tourSchema.pre(/^find/,function(next){
    // When this populate() function is called then in guides fields whatever id will be remaning that give populate or give full data. In MongoDB, the "populating()" refers to the process of filling in the fields of a document by referencing data from another collection or document.
    this.populate({
        path: 'guides',// which field will have to be populated
        select: '-__v -passwordChangedAt' // Which fields we have to remove from data showing.
    });
    next();
})

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
