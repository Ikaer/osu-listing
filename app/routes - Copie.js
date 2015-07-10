var Beatmap = require('./models/beatmap');
var Q = require('q');
var _ = require('underscore');
module.exports = function (app) {

    app.get('/api/beatmaps', function (req, res) {


        var filters = req.query.f ? JSON.parse(req.query.f) : null;

        // console.log(filters)
        var groupPipe = {
            $group: {
                _id: {
                    "beatmapset_id": "$beatmapset_id"
                },
                beatmaps: {$push: "$$ROOT"},
                name : {$first: "$title"}
            }
        };
        var matchPipeline = {
            $match:{

            }
        };

        query = Beatmap.find({'difficulty': {$in: filters.difficulties}});

        if (filters && filters.groupBy) {
            _.each(filters.groupBy, function (gb) {
                groupPipe.$group._id[gb] = "$" + gb;
            });
        }
        if (filters && filters.difficulties) {
            matchPipeline.$match.difficulty = {
                $in: filters.difficulties
            }
        }
        var aggregatePipeline = [];

        aggregatePipeline.push(matchPipeline);

        aggregatePipeline.push(groupPipe);

        var query = Beatmap.aggregate(aggregatePipeline);
        query.exec(function (err, beatmaps) {

            if (err) {
                res.send(err);
            }
            else {
                res.json(beatmaps); // return all beatmaps in JSON format
            }
        })
        //Beatmap.find(function (err, beatmaps) {
        //    res.json(beatmaps); // return all beatmaps in JSON format
        //});
    });
    //app.get('/api/beatmaps', function (req, res) {
    //
    //        var groupby = JSON.parse(req.query.gb);
    //        console.log(groupby)
    //        var filters = JSON.parse(req.query.f);
    //
    //
    //
    //
    //        var inf = filters.difficulties[0];
    //        var sup = filters.difficulties[filters.difficulties.length - 1];
    //
    //        Beatmap.find().
    //            where('difficultyrating').gt(inf).lt(sup).
    //            exec(function (err, beatmaps) {
    //
    //                if (err) {
    //                    res.send(err);
    //                }
    //                else {
    //                    res.json(beatmaps); // return all beatmaps in JSON format
    //                }
    //            })
    //
    //    }
    //)
    //;
    app.get('/api/difficultyRatingRange', function (req, res) {
        var sortMin = {difficulty: 1};
        var sortMax = {difficulty: -1};

        var fnGetMinMax = function (isMin) {
            var dValue = Q.defer();
            Beatmap.findOne({}, null, {
                limit: 1,
                sort: isMin ? sortMin : sortMax
            }, function (err, value) {
                dValue.resolve(value.difficultyrating);
            });
            return dValue.promise;
        };

        Q.all([fnGetMinMax(true), fnGetMinMax(false)]).spread(function (min, max) {
            res.json({min: Math.floor(min), max: Math.floor(max)});
        });
    });


    app.get('*', function (req, res) {
        res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });

}
;