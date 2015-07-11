var mongoose = require('mongoose');

// create an export function to encapsulate the model creation
module.exports = mongoose.model('BeatmapSet', {
    "artist"           : String,
    "beatmapset_id"    : Number,
    "title"            : String,
    "last_update"      : Date,
    "xFetchDate"       : Date,
    "xFiles"            : [{"name": String, "data" : Buffer}],
    "xTreatmentId"      : String
}, 'beatmapsets');

