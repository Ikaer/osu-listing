var mongoose = require('mongoose');

module.exports = mongoose.model('Beatmap', {
    "approved"         : Number,                   // 3 = qualified, 2 = approved, 1 = ranked, 0 = pending, -1 = WIP, -2 = graveyard
    "approved_date"    : Date, // date ranked, UTC+8 for now
    "last_update"      : Date, // last update date, timezone same as above. May be after approved_date if map was unranked and reranked.
    "artist"           : String,
    "beatmap_id"       : Number,              // beatmap_id is per difficulty
    "beatmapset_id"    : Number,               // beatmapset_id groups difficulties into a set
    "bpm"              : Number,
    "creator"          : String,
    "difficultyrating" : Number,             // The amount of stars the map would have ingame and on the website
    "difficulty"       : Number,
    "diff_size"        : Number,                   // Circle size value (CS)
    "diff_overall"     : Number,                   // Overall difficulty (OD)
    "diff_approach"    : Number,                   // Approach Rate (AR)
    "diff_drain"       : Number,                   // Healthdrain (HP)
    "hit_length"       : Number,                 // seconds from first note to last note not including breaks
    "source"           : String,
    "title"            : String,      // song name
    "total_length"     : Number,                 // seconds from first note to last note including breaks
    "version"          : String,            // difficulty name
    "mode"             : Number,                    // game mode
    "xFileName"        : String
}, 'beatmaps');