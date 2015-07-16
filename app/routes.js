// todo: create rss feed about creator with download link

var Beatmap = require('./models/beatmap');
var BeatmapSet = require('./models/beatmapSet');


var nconf = require('nconf');
nconf.file({file: 'config.json'});

var _ = require('underscore');
var http = require('http');
var fs = require('fs');
var JSZip = require("jszip");
var S = require('string');
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
        var regex = new RegExp(search, 'i');
        pipeline.push({
            $match: {
                creator: regex
            }
        })
    }
    pipeline.push({
        $group: {
            _id: {
                "creator": "$creator"
            },
            name: {$first: "$creator"},
            beatmapCount: {$sum: 1}
        }
    })
    pipeline.push({
        $project: {
            _id: 0,
            name: 1,
            beatmapCount: 1
        }
    });


    Beatmap.aggregate(pipeline)
        .sort({'beatmapCount': -1})
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
            $match: {$and: []}
        };

        if (filters && filters.groupBy) {
            _.each(filters.groupBy, function (gb) {
                groupPipe.$group._id[gb] = "$" + gb;
            });
        }

        if (filters && filters.tags) {
            _.each(filters.tags, function (v, k) {
                if (v.length > 0) {
                    if ('creators' === k) {
                        matchPipeline.$match.$and.push({
                            creator: {
                                $in: v
                            }
                        });
                    }
                }
            });
        }
        if (filters && filters.difficulties) {
            matchPipeline.$match.$and.push({
                difficulty: {
                    $in: filters.difficulties
                }
            });
        }
        ;
        if (filters && filters.modes) {
            matchPipeline.$match.$and.push({
                mode: {
                    $in: filters.modes
                }
            });
        }

        var aggregatePipeline = [];
        aggregatePipeline.push(matchPipeline);
        aggregatePipeline.push(queryTools.pipes.projects.cleanBeatmap);
        aggregatePipeline.push({$sort: {'difficultyrating': 1}});
        aggregatePipeline.push(groupPipe);

        console.log(JSON.stringify(aggregatePipeline))

        var query = Beatmap.aggregate(aggregatePipeline);
        query.sort({'name': 1});
        query.skip(req.pageSize * req.pageIndex);
        query.limit(req.pageSize);

        query.exec(function (err, packs) {
            if (err) {
                res.send([]);
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
        //var beatmapSetIsReady = Q.defer();
        //var beatmapsAreReady = Q.defer();
        var filters = req.query.f ? JSON.parse(req.query.f) : null;
        console.log(filters);


        BeatmapSet.findOne({'beatmapset_id': filters.beatmapSetId}, function (err, beatmapSet) {

            var fileName = util.format('%s %s - %s.osz', beatmapSet.beatmapset_id, beatmapSet.artist, beatmapSet.title);

            Beatmap.find({'beatmapset_id': filters.beatmapSetId}, function (err, allBeatmaps) {
                var excludedBeatmaps = _.filter(allBeatmaps, function (beatmap) {
                    return (undefined === _.find(filters.beatmapsIds, function (selectedId) {
                        return beatmap.beatmap_id === selectedId;
                    }));
                });

                fs.readFile(nconf.get('stuffPath') + filters.beatmapSetId + '/' + filters.beatmapSetId + '.osz', function (err, data) {
                    if (err) throw err;
                    var zip = new JSZip(data);
                    _.each(excludedBeatmaps, function (excludedBeatmap) {
                        var replaceInvalidCharacters = excludedBeatmap.xFileName.replace(/[\/:*?"<>|.]/g, "");
                        var cleanExtenstion = S(replaceInvalidCharacters).left(replaceInvalidCharacters.length - 3).toString();
                        var addExtension = cleanExtenstion + '.osu';

                        zip.remove(addExtension);
                    });
                    try {
                        //var buffer = zip.generate({type: "nodebuffer"});
                        var buffer = zip.generate({base64: false, compression: 'DEFLATE'});
                        //var data = zip.generate({base64: false, compression: 'DEFLATE'});
                        var headers = {
                            'Content-Disposition': 'attachment;filename="' + fileName + '"',
                            'Content-Length': buffer.length,
                            'Content-Type': 'application/download'
                        };
                        res.writeHead(200, headers);
                        res.write(buffer, 'binary');
                        res.end();
                        res.on('finish', function (err) {
                            console.log('fichier t�l�charg�');
                        });
                    }
                    catch (e) {
                        throw e;
                    }
                });

            });
        });
    });
    app.get('/api/authors', function (req, res) {
        queryTools.searchCreators(function (error, creators) {
            res.json(creators);
        });
    });
    app.get('/api/authors/:search', function (req, res) {
        queryTools.searchCreators(function (error, creators) {
            res.json(creators);
        }, req.params.search);
    });
    app.get('*', function (req, res) {
        res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });

}
;