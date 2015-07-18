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
var Q = require('q');
var archiver = require('archiver');

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

QueryTools.prototype.searchGeneric = function (search, field, sortByCount, sortIsDesc) {
    var d = Q.defer();
    var sortFilter = {};
    var pipeline = [];

    // filter beatmaps table
    if (search && search !== '') {
        var regex = new RegExp(search, 'i');
        var $match = {};
        $match[field] = regex;
        pipeline.push({
            $match: $match
        })
    }

    // group by a field with count
    var $group = {
        _id: {},
        count: {$sum: 1}
    };
    $group._id[field] = '$' + field;
    $group.value = {$first: '$' + field};
    pipeline.push({
        $group: $group
    });

    // result to get
    pipeline.push({
        $project: {
            _id: 0,
            value: 1,
            type: {$literal: field},
            count: 1
        }
    });

    // sort to apply (value or count)
    var sortField = true === sortByCount ? 'count' : 'value';
    sortFilter[sortField] = true === sortIsDesc ? -1 : 1;

    // exec.
    Beatmap.aggregate(pipeline)
        .sort(sortFilter)
        .exec(function (err, doc) {
            if (err) d.reject(err)
            else d.resolve(doc);
        });
    return d.promise;
}
QueryTools.prototype.searchCreators = function (search, sortByCount, sortIsDesc) {
    return this.searchGeneric(search, 'creator', sortByCount, sortIsDesc);
}
QueryTools.prototype.searchSongs = function (search, sortByCount, sortIsDesc) {
    return this.searchGeneric(search, 'title', sortByCount, sortIsDesc);
}
QueryTools.prototype.searchArtists = function (search, sortByCount, sortIsDesc) {
    return this.searchGeneric(search, 'artist', sortByCount, sortIsDesc);
}
QueryTools.prototype.mergeSortedTags = function (a, b, sortByCount, sortIsDesc) {
    var sortComparison = null;
    if (true === sortByCount) {
        if (true === sortIsDesc) {
            sortComparison = function (x, y) {
                return x.count > y.count
            }
        }
        else {
            sortComparison = function (x, y) {
                return x.count < y.count
            }
        }
    }
    else {
        if (true === sortIsDesc) {
            sortComparison = function (x, y) {
                return x.value > y.value
            }
        }
        else {
            sortComparison = function (x, y) {
                return x.value < y.value
            }
        }
    }

    var answer = [];
    var i = 0, j = 0;
    var maxCount = a.length > b.length ? a.length : b.length;

    while (i < a.length && j < b.length) {
        if (sortComparison(a[i], b[j])) {
            answer.push(a[i]);
            i++;
        }
        else {
            answer.push(b[j]);
            j++;
        }
    }

    while (i < a.length) {
        answer.push(a[i]);
        i++;
    }

    while (j < b.length) {
        answer.push(b[j]);
        j++;
    }
    return answer;
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
    app.param('isMultiPack', function (req, res, next, isMultipack) {
        req.isMultiPack = isMultipack == '1';
        next();
    })
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
                title: {$first: "$title"},
                artist: {$first: "$artist"},
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
                    var tagFilter = {};
                    tagFilter[k] = {$in: v}
                    matchPipeline.$match.$and.push(tagFilter);
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

//        console.log(JSON.stringify(aggregatePipeline))

        var query = Beatmap.aggregate(aggregatePipeline);
        query.sort({'beatmapset_id': -1, 'name': 1});
        query.skip(req.pageSize * req.pageIndex);
        query.limit(req.pageSize);

        query.exec(function (err, packs) {
            var response = {
                packs: [],
                downloadAllLink: null
            }
            if (err) {
                res.send(response);
            }
            else {
                response.packs = packs;
                var downloadAllLink = [];
                _.each(response.packs, function (pack) {
                    var fileName = util.format('%s %s - %s.osz', pack.beatmaps[0].beatmapset_id, pack.beatmaps[0].artist, pack.beatmaps[0].title);
                    var filter = {
                        "beatmapsIds": pack.beatmapsIds,
                        "beatmapSetId": pack.beatmapset_id
                    };
                    downloadAllLink.push(filter);
                    pack.downloadLink = '/api/download/0/?f=' + JSON.stringify(filter);
                    pack.downloadName = fileName;
                });
                response.downloadAllLink = '/api/download/1/?f=' + JSON.stringify(downloadAllLink);
                res.json(response);
            }
        })
    });
    app.get('/api/download/:isMultiPack', function (req, res) {

        var filters = req.query.f ? JSON.parse(req.query.f) : null;

        var errorOccurred = function (message, endResponse) {
            console.error(message);
            if (false === req.isMultiPack || true === endResponse) {
                res.statusCode = 404;
                res.end();
            }
        }
        var oszFiles = [];
        var archive = null;
        if (false === req.isMultiPack) {
            oszFiles = [filters];
        }
        else {
            oszFiles = filters;
            archive = archiver('zip');
            archive.on('error', function (err) {
                errorOccurred(err, true);
            })
            archive.pipe(res);
        }
        _.each(oszFiles, function (filters) {
            filters.isReady = Q.defer();
        });

        _.each(oszFiles, function (oszFile) {
            BeatmapSet.findOne({'beatmapset_id': oszFile.beatmapSetId}, function (err, beatmapSet) {
                if (err) {
                    errorOccurred(util.format('error while retrieving beatmapset %s from mongodb: %s', beatmapSet.beatmapset_id, err));
                }
                if (null === beatmapSet) {
                    errorOccurred(util.format('beatmapset %s not found in mongodb', beatmapSet.beatmapset_id))
                }
                else {
                    var fileName = util.format('%s %s - %s.osz', beatmapSet.beatmapset_id, beatmapSet.artist, beatmapSet.title);

                    Beatmap.find({'beatmapset_id': oszFile.beatmapSetId}, function (err, allBeatmaps) {
                        if (err) {
                            errorOccurred(util.format('error while retrieving beatmaps for beatmapset %s from mongodb: %s', beatmapSet.beatmapset_id, err))
                        }
                        if (0 === allBeatmaps.length) {
                            errorOccurred(util.format('no beatmaps found in mongodb for beatmapset %s', beatmapSet.beatmapset_id))
                        }
                        else {

                            var excludedBeatmaps = _.filter(allBeatmaps, function (beatmap) {
                                return (undefined === _.find(oszFile.beatmapsIds, function (selectedId) {
                                    return beatmap.beatmap_id === selectedId;
                                }));
                            });
                            var filePath = nconf.get('stuffPath') + oszFile.beatmapSetId + '/' + oszFile.beatmapSetId + '.osz';
                            fs.readFile(filePath, function (err, data) {
                                if (err) {
                                    errorOccurred(util.format('error when reading %s', filePath));
                                }
                                else {
                                    try {
                                        var zip = new JSZip(data);
                                        _.each(excludedBeatmaps, function (excludedBeatmap) {
                                            var replaceInvalidCharacters = excludedBeatmap.xFileName.replace(/[\/:*?"<>|.]/g, "");
                                            var cleanExtenstion = S(replaceInvalidCharacters).left(replaceInvalidCharacters.length - 3).toString();
                                            var addExtension = cleanExtenstion + '.osu';
                                            zip.remove(addExtension);
                                        });
                                        var buffer = zip.generate({type: 'nodebuffer'});
                                        if (req.isMultiPack === false) {
                                            res.write(buffer, 'binary');
                                        }
                                        else {
                                            archive.append(buffer, {name: fileName});
                                        }
                                        oszFile.isReady.resolve();
                                    }
                                    catch (e) {
                                        errorOccurred(e.message);
                                    }
                                }
                            });
                        }
                    });
                }
            })
        })


        Q.all(_.map(oszFiles, function(f){ return f.isReady.promise; })).then(function () {
            if (req.isMultiPack === true) {
                try {
                    archive.finalize(function (err, bytes) {
                        if (err) {
                            errorOccurred(err, true);
                        }
                        res.end();
                    });
                }
                catch (e) {
                    errorOccurred(e, true);
                }
            }
            else{
                res.end();
            }
        })
    });
    app.get('/api/authors', function (req, res) {
        Q.when(queryTools.searchCreators('', true, true)).then(function (creators) {
            res.json(creators)
        }).catch(function (err) {
            res.statusCode = '500';
            res.json = err;
        });
    });
    app.get('/api/authors/:search', function (req, res) {
        Q.when(queryTools.searchCreators(req.params.search, true, true)).then(function (creators) {
            res.json(creators)
        }).catch(function (err) {
            res.statusCode = '500';
            res.json = err;
        });
    });
    app.get('/api/tags/:search', function (req, res) {
        var sortByCount = true;
        var sortIsDesc = true;
        Q.all([
            queryTools.searchCreators(req.params.search, true, true),
            queryTools.searchArtists(req.params.search, true, true),
            queryTools.searchSongs(req.params.search, true, true)
        ]).spread(function (creators, artists, songs) {
            var finalArrays = queryTools.mergeSortedTags(creators, artists, sortByCount, sortIsDesc);
            finalArrays = queryTools.mergeSortedTags(finalArrays, songs, sortByCount, sortIsDesc);
            if (finalArrays.length > 20) {
                finalArrays = finalArrays.slice(0, 19);
            }
            res.json(finalArrays);
        }, function (err) {
            res.statusCode = '500';
            res.json = err;
        })

        queryTools.searchCreators(function (error, creators) {
            res.json(creators);
        }, req.params.search, sortByCount, sortIsDesc);
    });
    app.get('*', function (req, res) {
        res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });


}
;