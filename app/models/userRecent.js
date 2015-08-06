var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var UserRecentSchema = new Schema({
    "beatmap_id": Number,
    "score": Number,
    "count300": Number,
    "count100": Number,
    "count50": Number,
    "countmiss": Number,
    "maxcombo": Number,
    "countkatu": Number,
    "countgeki": Number,
    "perfect": Number,          // 1 = maximum combo of map reached, 0 otherwise
    "enabled_mods": Number,         // bitwise flag representation of mods used. see reference
    "user_id": Number,
    "date": Date,
    "rank": String
});

mongoose.model('UserRecent', UserRecentSchema);
module.exports = mongoose.model('UserRecent');

