var Beatmap = require('./models/beatmap');
var Q = require('q');
var _ = require('underscore');
var http = require('http');
var fs = require('fs');
var unzip = require('unzip');
var S = require('string');
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
                name: {$first: "$title"},
                beatmapset_id: {$first: "$beatmapset_id"}
            }
        };
        var matchPipeline = {
            $match: {}
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
    app.get('/api/beatmaps/download', function (req, res) {
        var readyToDowload = Q.defer();
        var filters = req.query.f ? JSON.parse(req.query.f) : null;
        console.log(filters)
        var beatmapSet_Ids = filters.beatmapSet_Ids;
        var pathOfWorking = 'c:/osutest/'

        var file = fs.createWriteStream(pathOfWorking + 'osudownload_1.osz')

        var urlToDownload = 'http://bloodcat.com/osu/s/' + beatmapSet_Ids
        console.log(urlToDownload)
        console.log()
        var httpGet = http.get(urlToDownload, function (response) {
            response.pipe(file);
            response.on('end', function () {
                var unzipDone = fs.createReadStream(pathOfWorking + 'osudownload_1.osz').pipe(unzip.Extract({path: pathOfWorking + 'osudownload_1'}));
                unzipDone.on('finish', function () {
                    fs.readdir(pathOfWorking + 'osudownload_1', function (err, files) {
                        var filesToRezip = [];
                        _.each(files, function (file) {
                            if (S(file).endsWith('.osu')) {
                               // if(filters.bea)
                                console.log('osu file: ' + file);
                                //fs.readFile(pathOfWorking + 'osudownload_1/' + file,'utf-8', function(err, data){
                                //    console.log(data);
                                //});

                            }
                            else {
                                filesToRezip.push(file)
                            }
                        })

                    })
                })
            })
        });


    })
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