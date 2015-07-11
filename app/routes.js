var BeatmapWithData = require('./models/beatmapWithData');
var Beatmap = require('./models/beatmap');
var BeatmapSet = require('./models/beatmapSet');

var Q = require('q');
var _ = require('underscore');
var http = require('http');
var fs = require('fs');
var S = require('string');
var nodeZip = require('node-zip');
var util = require('util');
function QueryTools() {
    this.pipes = {
        projects: {
            cleanBeatmap: {
                $project: {
                    _id: 0,
                    "approved": 1,
                    "approved_date": 1,
                    "last_update": 1,
                    "artist": 1,
                    "beatmap_id": 1,
                    "beatmapset_id": 1,
                    "bpm": 1,
                    "creator": 1,
                    "difficultyrating": 1,
                    "diff_size": 1,
                    "diff_overall": 1,
                    "diff_approach": 1,
                    "diff_drain": 1,
                    "hit_length": 1,
                    "source": 1,
                    "title": 1,
                    "total_length": 1,
                    "version": 1,
                    "mode": 1,
                    "difficulty": 1
                }

            }
        }
    };
}
QueryTools.prototype.searchCreators = function (callback, search, sort) {
    var sortFitler = {};
    var pipeline = [];
    if (sort && sort !== '') {
        sortFitler[sort] = 1
    }
    else {
        sortFitler['creator'] = 1
    }
    if (search && search !== '') {
        //db.users.find({name: /a/})  //like '%a%'
        //out: paulo, patric
        //
        //db.users.find({name: /^pa/}) //like 'pa%'
        //out: paulo, patric
        //
        //db.users.find({name: /ro$/}) //like '%ro'

        var regex = new RegExp(search, 'i');
        pipeline.push({
            $match:{
                creator: regex
            }
        })
    }
    pipeline.push({
        $group: {
            _id: {
                "creator": "$creator"
            },
            creator: {$first: "$creator"},
            beatmapCount: {$sum: 1}
        }
    })
    pipeline.push({
        $project: {
            _id: 0,
            creator: 1,
            beatmapCount: 1
        }
    });


    Beatmap.aggregate(pipeline)
        .sort({'creator': 1})
        .exec(callback);
}
var queryTools = new QueryTools();


module.exports = function (app) {
    app.param('pageIndex', function (req, res, next, pageIndex) {
        req.pageIndex = parseInt(pageIndex, 10);
        next();
    });
    app.param('pageSize', function (req, res, next, pageSize) {
        req.pageSize = parseInt(pageSize, 10);
        req.pageSize = req.pageSize > 100 ? 100 : req.pageSize;
        next();
    });
    app.get('/api/beatmaps/:pageIndex/:pageSize', function (req, res) {

        var filters = req.query.f ? JSON.parse(req.query.f) : null;
        var groupPipe = {
            $group: {
                _id: {
                    "beatmapset_id": "$beatmapset_id"
                },
                beatmapsIds: {$push: "$$ROOT.beatmap_id"},
                beatmaps: {$push: "$$ROOT"},
                name: {$first: "$title"},
                beatmapset_id: {$first: "$beatmapset_id"}
            }
        };

        var matchPipeline = {
            $match: {}
        };

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
        aggregatePipeline.push(queryTools.pipes.projects.cleanBeatmap);
        aggregatePipeline.push({$sort: {'difficultyrating': 1}});
        aggregatePipeline.push(groupPipe);

        var query = Beatmap.aggregate(aggregatePipeline);
        query.sort({'name': 1});
        query.skip(req.pageSize * req.pageIndex);
        query.limit(req.pageSize);

        query.exec(function (err, packs) {
            if (err) {
                res.send(err);
            }
            else {
                _.each(packs, function (pack) {
                    var fileName = util.format('%s %s - %s.osz', pack.beatmaps[0].beatmapset_id, pack.beatmaps[0].artist, pack.beatmaps[0].title);
                    pack.downloadLink = '/api/beatmaps/download?f=' + JSON.stringify({
                            "beatmapsIds": pack.beatmapsIds,
                            "beatmapSetId": pack.beatmapset_id
                        });
                    pack.downloadName = fileName;
                });
                res.json(packs);
            }
        })
    });
    app.get('/api/beatmaps/download', function (req, res) {
        var beatmapSetIsReady = Q.defer();
        var beatmapsAreReady = Q.defer();
        var filters = req.query.f ? JSON.parse(req.query.f) : null;
        console.log(filters);

        var zip = nodeZip();
        BeatmapWithData.find({'beatmap_id': {$in: filters.beatmapsIds}}, function (err, beatmapsWithData) {
            _.each(beatmapsWithData, function (map) {
                zip.file(map.xFile.name, map.xFile.data);
            });
            beatmapsAreReady.resolve();
        });
        BeatmapSet.findOne({'beatmapset_id': filters.beatmapSetId}, function (err, beatmapSet) {
            _.each(beatmapSet.xFiles, function (xF) {
                zip.file(xF.name, xF.data);
            });
            var fileName = util.format('%s %s - %s.osz', beatmapSet.beatmapset_id, beatmapSet.artist, beatmapSet.title);
            beatmapSetIsReady.resolve(fileName);
        });

        Q.allSettled([beatmapSetIsReady.promise, beatmapsAreReady.promise]).then(function (results) {
            var data = zip.generate({base64: false, compression: 'DEFLATE'});
            var headers = {
                'Content-Disposition': 'attachment;filename="' + results[0].value + '"',
                'Content-Length': data.length,
                'Content-Type': 'application/download'
            };
            res.writeHead(200, headers);
            res.write(data, 'binary');
            res.end();
        });
    });
    app.get('/api/authors', function (req, res) {
        queryTools.searchCreators(function (error, creators) {
            res.json(creators);
        });
    });
    app.get('/api/authors/:search', function (req, res) {
        queryTools.searchCreators( function (error, creators) {
            res.json(creators);
        }, req.params.search);
    });
    app.get('*', function (req, res) {
        res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });

}
;