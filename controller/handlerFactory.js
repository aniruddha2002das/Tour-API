const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const { populate } = require('../models/reviewModel');
const APIFeatures = require("./../utils/apiFeatures");

exports.deleteOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
        return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.updateOne = Model => catchAsync(async (req, res, next) => {
    // console.log("hi");
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body,{
        new: true,
        runValidators: true
    });
    
    if(!doc){
        return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            data: doc
        }
    })
});


exports.createOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
        status: "success",
        data: {
            data: doc
        },
    });
});


exports.getOne = (Model, populateOptions) =>  catchAsync(async (req, res, next) => {
    const id = req.params.id;

    /************************************************************************************/ 
    // When this function populate() is called then in guides fields whatever id will be remaning that give populate or give full data. In MongoDB, the "populating()" refers to the process of filling in the fields of a document by referencing data from another collection or document.
    // const tour = await Tour.findById(id).populate({
    //     path: 'guides',// which field will have to be populated
    //     select: '-__v -passwordChangedAt' // Which fields we have to remove from data showing.
    // });
    /*************************************************************************************/ 


    let query = Model.findById(id);
    // It there is any argument in populateOptions then that will be running
    if(populateOptions) query.populate(populateOptions);
    const doc = await query;


    // If tour is not found then 
    if (!doc) {
        // We have to return this immediately Because we don't want to execution is going on to next line.
        return next(new AppError('No document found with that ID ', 404));
    }

    res.status(200).json({
        status: "success",
        data: {
            doc,
        },
    });
});



exports.getAll = Model => catchAsync(async (req, res, next) => {
    // /*** // BUILD query

    // // 1A) Filtering
    // // For object destructuring purposes ... is used
    // // All Fields of req.query will be imported into queryObject. ***/
    // const queryObject = { ...req.query };
    // const excludeFields = ["page", "sort", "limit", "fields"];
    // excludeFields.forEach((ele) => delete queryObject[ele]);

    // /*** // 1B) Advanced Filtering
    // // Convert into string
    // let queryString = JSON.stringify(queryObject); ***/
    // queryString = queryString.replace(
    //     /\b(gte|gt|lte|lt)\b/g,
    //     (match) => `$${match}`
    // );

    // /*** // Convert into json ***/
    // let query = Tour.find(JSON.parse(queryString));

    /*** // Sorting ***/
    // if (req.query.sort) {
    //     /*** // To sort multiple criteria ***/
    //     const sortFix = req.query.sort.split(",").join(" ");
    //     query = query.sort(sortFix);
    // } else {
    //     query = query.sort("createdAt");
    // }

    /*** // Selecting Fields ***/
    // if (req.query.fields) {
    //     const selectFix = req.query.fields.split(",").join(" ");
    //     query = query.select(selectFix);
    // } else {
    //     /*** // Excluding only fields Here we exclude only '__v' field ***/
    //     query = query.select("-__v");
    // }

    /*** // Pagination
        // To convert to srting in JS req.query.page * 1 ***/
    // const page = req.query.page * 1 || 1;
    // const limit = req.query.limit * 1 || 10;
    // const skip = (page - 1) * limit;
    // query = query.skip(skip).limit(limit);

    // if (req.query.page) {
    //     const numTours = await Tour.countDocuments();
    //     if (skip >= numTours) {
    //         throw new Error("This page does not exist.");
    //     }
    // }



    // This is for GET /tour/4389ufhyt823/review
    // To allow nested GET reviews on tour.
    let filter = {};
    if(req.params.tourID) filter = { tour: req.params.tourID };

    
    const feature = new APIFeatures(Model.find(filter), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginations();

    // EXECUTE query
    // const doc = await feature.query.explain();
    const doc = await feature.query;

    // SEND response
    res.status(200).json({
        status: "success",
        results: doc.length,
        data: { doc },
    });
});