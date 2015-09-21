// todo: create rss feed about creator with download link

var Beatmap = require('./models/beatmap');
var User = require('./models/user');

var nconf = require('nconf');
nconf.file({file: 'config.json'});
nconf.file('private', 'private.json');

var escape = require('regexp.escape');

var _ = require('underscore');
var http = require('http');
var fs = require('fs');
var JSZip = require("jszip");
var S = require('string');
var util = require('util');
var Q = require('q');
var archiver = require('archiver');
var contentDisposition = require('content-disposition')
var nodemailer = require('nodemailer');
var path = require('path');

var moment = require('moment');
var AuthTools = require('./authTools');
var authTools = new AuthTools();

require("moment-duration-format");


var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: nconf.get('gmailAccount'),
        pass: nconf.get('gmailPassword')
    }
});


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
                    "difficulty": 1,
                    "xFileName": 1,
                    "playCount": 1,
                    "playSuccess": 1,
                    "favouritedCount": 1,
                    "genre": 1,
                    "language": 1,
                    "negativeUserRating": 1,
                    "positiveUserRating": 1,
                    "tags": 1,
                    "submitted_date": 1
                }

            },
            cleanBeatmapFirst: {
                $project: {
                    _id: 0,
                    "approved_date": 1
                }

            }
        }
    };
}

QueryTools.prototype.searchGeneric = function (search, field, sortByCount, sortIsDesc) {
    var d = Q.defer();

    if (field === 'tags') {
        var o = {};
        if (search && search !== '') {
            var regex = new RegExp(escape(search), 'i');
            var $match = {};
            $match[field] = regex;
            o.query = {
                tags: regex
            }
            o.scope = {
                regex: regex
            }
        }
        o.map = function () {
            this.tags.forEach(function (t) {
                if (t.match(regex)) {
                    emit(t, 1)
                }
            })
        }
        o.reduce = function (k, vals) {
            return vals.length
        }
        Beatmap.mapReduce(o, function (err, results) {
            if (err) d.resolve([])
            else {
                var foundTags = _.map(results, function (r) {
                    return {
                        value: r._id,
                        type: 'tags',
                        count: r.value
                    }
                })
                d.resolve(foundTags);
            }
        })

    }
    else {
        var sortFilter = {};
        var pipeline = [];

        // filter beatmaps table
        if (search && search !== '') {
            var regex = new RegExp(escape(search), 'i');
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
            .limit(3)
            .exec(function (err, docs) {
                if (err) d.reject(err)
                else d.resolve(docs);
            });
    }

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
QueryTools.prototype.searchSources = function (search, sortByCount, sortIsDesc) {
    return this.searchGeneric(search, 'source', sortByCount, sortIsDesc);
}
QueryTools.prototype.searchTags = function (search, sortByCount, sortIsDesc) {
    return this.searchGeneric(search, 'tags', sortByCount, sortIsDesc);
}
QueryTools.prototype.addResultToTags = function (results, currentTags, name, categoryIndex) {
    if (currentTags.length > 0) {
        var slicedTags = currentTags.length > 5 ? currentTags.slice(0, 5) : currentTags;
        var tagsResults = _.map(slicedTags, function (c) {
            return {
                title: c.value,
                o: c
            }
        })
        results.results['category' + categoryIndex] = {
            name: name,
            results: tagsResults
        }
        return 1
    }
    return 0;
}

QueryTools.prototype.attachUserDataToBeatmap = function (session, beatmap) {
    beatmap.playedByUser = false;
    beatmap.userRank = null;
    if (session.isAuthenticated === true && session.user) {
        if (session.user.beatmaps) {

        }
        if (session.user.beatmaps) {

        }
        if (session.user.scores) {
            var foundBeatmap = _.find(session.user.scores, function (x) {
                return x.beatmap_id === beatmap.beatmap_id;
            })
            if (foundBeatmap === undefined) {
                foundBeatmap = _.find(session.user.recents, function (x) {
                    return x.beatmap_id === beatmap.beatmap_id;
                })
            }
            if (foundBeatmap !== undefined) {
                beatmap.playedByUser = true;
                beatmap.userRank = foundBeatmap.rank;
            }
        }
    }
}
QueryTools.prototype.normalizeInteger = function (object, property) {
    if (object.hasOwnProperty(property)) {
        try {
            if (object.hasOwnProperty(property)) {
                object[property] = parseInt(object[property], 10)
            }
        }
        catch (e) {
            object[property] = 0;
        }
    }
}
QueryTools.prototype.normalizeData = function (beatmap) {
    var that = this;
    that.normalizeInteger(beatmap, 'playCount')
    that.normalizeInteger(beatmap, 'playSuccess')
    that.normalizeInteger(beatmap, 'favouritedCount')
    that.normalizeInteger(beatmap, 'negativeUserRating')
    that.normalizeInteger(beatmap, 'positiveUserRating')
}

QueryTools.prototype.getBeatmapsetIdsFromBeatmapId = function (beatmapIds, fnOk, fnKo) {
    Beatmap.find({
        beatmap_id: {
            $in: beatmapIds
        }
    }, {
        beatmapset_id: 1
    }, {
        sort: {
            beatmapset_id: 1
        }
    }, function (err, beatmaps) {
        if (err) {
            fnKo(err.message)
        }
        else {
            var beatmapsetIds = _.uniq(_.map(beatmaps, function (b) {
                return b.beatmapset_id
            }), true);
            fnOk(beatmapsetIds);
        }
    });
}
QueryTools.prototype.testMinAndMaxEquality = function (minProperty, maxProperty, databaseProperty, filters, matchPipeline, isDate, isFloat) {
    var ret = false;
    try {
        if (filters[minProperty] !== null && filters[maxProperty] !== null) {
            var val = null;
            var val2 = null;
            var dbFilter = {}
            if (isDate === true) {
                var moment1 = moment(filters[minProperty]);
                var moment2 = moment(filters[maxProperty]);
                val = moment1.format('YYYY-MM-DD')
                val2 = moment2.format('YYYY-MM-DD')
                if (val === val2) {


                    val += 'T00:00:00.000Z';
                    val2 += 'T23:59:59.999Z';
                    var start = new Date(val);
                    var end = new Date(val2);

                    var dbfilter1 = {};
                    dbfilter1[databaseProperty] = {}
                    dbfilter1[databaseProperty].$lte = end;
                    matchPipeline.$match.$and.push(dbfilter1)
                    var dbfilter2 = {};
                    dbfilter2[databaseProperty] = {}
                    dbfilter2[databaseProperty].$gte = start;
                    matchPipeline.$match.$and.push(dbfilter2)
                    var a = 2;
                    ret = true;
                }
            }
            else {
                if (true === isFloat) {
                    val = parseFloat(filters[minProperty]);
                    val2 = parseFloat(filters[maxProperty]);
                }
                else {
                    val = parseInt(filters[minProperty], 10);
                    val2 = parseInt(filters[maxProperty], 10);
                }
                if (val === val2) {
                    dbFilter[databaseProperty] = val;
                    matchPipeline.$match.$and.push(dbFilter)
                    ret = true;
                }
            }
        }
    }
    catch (e) {

    }
    return ret;
}
QueryTools.prototype.addMinOrMaxToQuery = function (minProperty, maxProperty, databaseProperty, filters, matchPipeline, isMin, isDate, isFloat) {
    var operator = isMin ? '$gte' : '$lte';
    var property = isMin ? minProperty : maxProperty;

    var isParsed = false;
    var val = null;
    if (filters[property] !== null) {
        if (isDate === true) {
            try {
                var moment1 = moment(filters[property]);
                var lastPart = isMin ? 'T00:00:00.000Z' : 'T23:59:59.999Z';
                val = new Date(moment1.format('YYYY-MM-DD') + lastPart);
                isParsed = true;
            }
            catch (e) {

            }
        }
        else {
            try {
                if (true === isFloat) {
                    val = parseFloat(filters[property]);
                }
                else {
                    val = parseInt(filters[property], 10);
                }
                if (isNaN(val) == false) {
                    isParsed = true;
                }
            }
            catch
                (e) {
            }

        }
        if (true === isParsed) {
            var dbFilter = {}
            dbFilter[databaseProperty] = {}
            dbFilter[databaseProperty][operator] = val;
            matchPipeline.$match.$and.push(dbFilter)
        }
    }
}
QueryTools.prototype.addMinAndMaxToQuery = function (minProperty, maxProperty, databaseProperty, filters, matchPipeline, isDate, isFloat) {
    if (filters && (filters[maxProperty] || filters[minProperty])) {
        if (this.testMinAndMaxEquality(minProperty, maxProperty, databaseProperty, filters, matchPipeline, isDate, isFloat) == false) {
            this.addMinOrMaxToQuery(minProperty, maxProperty, databaseProperty, filters, matchPipeline, true, isDate, isFloat);
            this.addMinOrMaxToQuery(minProperty, maxProperty, databaseProperty, filters, matchPipeline, false, isDate, isFloat);
        }
    }
}
var queryTools = new QueryTools();

var DownloadTools = function () {

}
DownloadTools.prototype.createToDownloadParams = function (beatmapSet, beatmaps) {
    return util.format('%s|%s', beatmapSet.beatmapset_id, _.map(beatmaps, function (b) {
        return b.beatmap_id
    }).join(','));
}
var downloadTools = new DownloadTools();

var RF = require('./formatResponse');
var rf = new RF();
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
    app.param('toDownload', function (req, res, next, toDownload) {
        req.toDownload = [];
        var setsAndMaps = toDownload.split(';');
        _.each(setsAndMaps, function (x) {
                var setAndMaps = x.split('|');
                var part = {
                    beatmapSetId: parseInt(setAndMaps[0], 10),
                    beatmapsIds: []
                }
                var mapsIds = setAndMaps[1].split(',');
                _.each(mapsIds, function (m) {
                    part.beatmapsIds.push(parseInt(m, 10))
                });
                req.toDownload.push(part);
            }
        );
        next();
    })
    app.param('extensionsToExclude', function (req, res, next, extensionsToExclude) {
        if (extensionsToExclude && extensionsToExclude !== '' && extensionsToExclude !== 'none') {
            req.extensionsToExclude = extensionsToExclude.split(';');
        }
        else {
            req.extensionsToExclude = [];
        }
        next();
    })
    app.get('/api/beatmaps/:pageIndex/:pageSize/:extensionsToExclude', function (req, res) {
        var filters = req.query.f ? JSON.parse(req.query.f) : null;

        Q.when(authTools.updateUser(req.session)).then(function () {
                var deferreds = [];
                var matchPipeline = {
                    $match: {$and: []}
                };

                if (filters && filters.tags) {
                    _.each(filters.tags, function (v, k) {
                        if (v.length > 0) {
                            var tagFilter = {};
                            tagFilter[k] = {$in: v}
                            matchPipeline.$match.$and.push(tagFilter);
                        }
                    });
                }
                if (filters && filters.difficulties && filters.difficulties.length < 5) {
                    matchPipeline.$match.$and.push({
                        difficulty: {
                            $in: filters.difficulties
                        }
                    });
                }
                if (filters && filters.modes && filters.modes.length < 4) {
                    matchPipeline.$match.$and.push({
                        mode: {
                            $in: filters.modes
                        }
                    });
                }
                if (filters && filters.approved) {
                    matchPipeline.$match.$and.push({
                        approved: {
                            $in: filters.approved
                        }
                    });
                }
                queryTools.addMinAndMaxToQuery('minDuration', 'maxDuration', 'total_length', filters, matchPipeline, false, false);
                queryTools.addMinAndMaxToQuery('minHPDrainRate', 'maxHPDrainRate', 'diff_drain', filters, matchPipeline, false, false);
                queryTools.addMinAndMaxToQuery('minCircleSize', 'maxCircleSize', 'diff_size', filters, matchPipeline, false, false);
                queryTools.addMinAndMaxToQuery('minOverallDifficulty', 'maxOverallDifficulty', 'diff_overall', filters, matchPipeline, false, false);
                queryTools.addMinAndMaxToQuery('minApproachRate', 'maxApproachRate', 'diff_approach', filters, matchPipeline, false, false);

                queryTools.addMinAndMaxToQuery('minDifficultyRating', 'maxDifficultyRating', 'difficultyrating', filters, matchPipeline, false, true);
                queryTools.addMinAndMaxToQuery('minHit_length', 'maxHit_length', 'hit_length', filters, matchPipeline, false, false);
                queryTools.addMinAndMaxToQuery('minPlayCount', 'maxPlayCount', 'playCount', filters, matchPipeline, false, false);
                queryTools.addMinAndMaxToQuery('minPlaySuccess', 'maxPlaySuccess', 'playSuccess', filters, matchPipeline, false, false);
                queryTools.addMinAndMaxToQuery('minFavouritedCount', 'maxFavouritedCount', 'favouritedCount', filters, matchPipeline, false, false);
                queryTools.addMinAndMaxToQuery('minNegativeUserRating', 'maxNegativeUserRating', 'negativeUserRating', filters, matchPipeline, false, false);
                queryTools.addMinAndMaxToQuery('minPositiveUserRating', 'maxPositiveUserRating', 'positiveUserRating', filters, matchPipeline, false, false);

                queryTools.addMinAndMaxToQuery('minApproved_date', 'maxApproved_date', 'approved_date', filters, matchPipeline, true);
                queryTools.addMinAndMaxToQuery('minLast_update', 'maxLast_update', 'last_update', filters, matchPipeline, true);
                queryTools.addMinAndMaxToQuery('minSubmitted_date', 'maxSubmitted_date', 'submitted_date', filters, matchPipeline, true);


                if (filters && filters.playedBeatmapValue > 0 && req.session.isAuthenticated === true) {

                    var recentIds = _.map(req.session.user.recents, function (r) {
                        return r.beatmap_id;
                    });
                    var scoreIds = _.map(req.session.user.scores, function (s) {
                        return s.beatmap_id;
                    })
                    var playedIds = recentIds.concat(scoreIds);
                    switch (filters.playedBeatmapValue) {
                        case 1: //  name:'Display only them when I\'ve played at least one difficulty', active:true},
                        case 2:// name:'Display only them when I\'ve played all difficulties'
                            var operator = filters.playedBeatmapValue === 1 ? '$nin' : '$in';
                            var getbeatmapsetIds = Q.defer();
                            deferreds.push(getbeatmapsetIds.promise);
                            queryTools.getBeatmapsetIdsFromBeatmapId(playedIds, function (beatmapset_ids) {
                                var playedFilter = {
                                    beatmapset_id: {}
                                }
                                playedFilter.beatmapset_id[operator] = beatmapset_ids;
                                matchPipeline.$match.$and.push(playedFilter);
                                getbeatmapsetIds.resolve();
                            }, function () {
                                getbeatmapsetIds.resolve();
                            })
                            break;
                    }
                }


                var aggregatePipeline = [];
                aggregatePipeline.push(matchPipeline);

                var groupPipe = {
                    $group: {
                        _id: {
                            "beatmapset_id": "$beatmapset_id"
                        },
                        beatmapsIds: {$push: "$$ROOT.beatmap_id"}

                    }
                };

                var sorting = {'approved_date': -1};
                if (filters && filters.sorting && filters.sorting.name !== null) {
                    sorting = {};
                    sorting[filters.sorting.name] = filters.sorting.direction;
                    groupPipe.$group[filters.sorting.name] = {$first: "$" + filters.sorting.name}

                }
                aggregatePipeline.push(groupPipe);

                var queryToGetdIds = Beatmap.aggregate(aggregatePipeline);
                queryToGetdIds.sort(sorting);
                queryToGetdIds.skip(req.pageSize * req.pageIndex);
                queryToGetdIds.limit(req.pageSize + 1);
                queryToGetdIds.options = {allowDiskUse: true};

                Q.all(deferreds).then(function () {
                    queryToGetdIds.exec(function (err, packs) {
                        var response = {
                            packs: [],
                            downloadAllLink: null,
                            hasNextPage: false
                        }
                        if (err) {
                            rf.sendError(res, err.message);
                        }
                        else {
                            if (packs.length > 0) {

                                var matchPipeline = {
                                    $match: {
                                        $and: [
                                            {
                                                beatmap_id: {
                                                    $in: []
                                                }
                                            }
                                        ]
                                    }
                                };
                                _.each(packs, function (p) {
                                    _.each(p.beatmapsIds, function (bId) {
                                        matchPipeline.$match.$and[0].beatmap_id.$in.push(bId);
                                    })
                                })


                                var aggregatePipeline = [];
                                aggregatePipeline.push(matchPipeline);
                                aggregatePipeline.push(queryTools.pipes.projects.cleanBeatmap);

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
                                        creator: {$addToSet: "$creator"},
                                        bpm: {$first: "$bpm"},
                                        beatmapset_id: {$first: "$beatmapset_id"},
                                        approved: {$first: "$approved"},
                                        approved_date: {$first: "$approved_date"},
                                        last_update: {$first: "$last_update"},
                                        hit_length: {$first: "$hit_length"},
                                        source: {$first: "$source"},
                                        total_length: {$first: "$total_length"},
                                        "playCount": {$sum: "$playCount"},
                                        "playSuccess": {$sum: "$playSuccess"},
                                        "favouritedCount": {$first: "$favouritedCount"},
                                        "genre": {$first: "$genre"},
                                        "language": {$first: "$language"},
                                        "negativeUserRating": {$first: "$negativeUserRating"},
                                        "positiveUserRating": {$first: "$positiveUserRating"},
                                        "tags": {$first: "$tags"},
                                        "submitted_date": {$first: "$submitted_date"}
                                    }
                                };
                                aggregatePipeline.push(groupPipe);


                                var sorting = {'approved_date': -1};
                                if (filters && filters.sorting && filters.sorting.name !== null) {
                                    sorting = {};
                                    sorting[filters.sorting.name] = filters.sorting.direction;
                                }


                                var queryToGetData = Beatmap.aggregate(aggregatePipeline);
                                queryToGetData.sort(sorting);
                                queryToGetData.options = {allowDiskUse: true};
                                queryToGetData.exec(function (err, packs) {
                                    var response = {
                                        packs: [],
                                        downloadAllLink: null,
                                        hasNextPage: false
                                    }
                                    if (err) {
                                        rf.sendError(res, err.message);
                                    }
                                    else {
                                        if (packs.length === req.pageSize + 1) {
                                            packs.pop();
                                            response.hasNextPage = true;
                                        }
                                        response.packs = packs;

                                        var downloadAllLink = [];
                                        _.each(response.packs, function (pack) {
                                            queryTools.normalizeData(pack);


                                            var fileName = util.format('%s %s - %s.osz', pack.beatmaps[0].beatmapset_id, pack.beatmaps[0].artist, pack.beatmaps[0].title);

                                            var toDownloadParam = downloadTools.createToDownloadParams(pack, pack.beatmaps)
                                            downloadAllLink.push(toDownloadParam);
                                            pack.downloadLink = '/api/download/0/' + toDownloadParam + '/';
                                            if (req.extensionsToExclude.length > 0) {
                                                pack.downloadLink += req.extensionsToExclude.join(';')
                                            }
                                            else {
                                                pack.downloadLink += 'none';
                                            }
                                            pack.downloadName = fileName;


                                            _.each(pack.beatmaps, function (beatmap) {


                                                var replaceInvalidCharacters = beatmap.xFileName.replace(/[\/:*?"<>|.]/g, "");
                                                var cleanExtenstion = S(replaceInvalidCharacters).left(replaceInvalidCharacters.length - 3).toString();
                                                fileName = cleanExtenstion + '.osz';
                                                beatmap.downloadLink = '/api/download/0/' + downloadTools.createToDownloadParams(pack, [beatmap]);
                                                beatmap.downloadName = fileName;

                                                queryTools.attachUserDataToBeatmap(req.session, beatmap);

                                            })
                                            pack.hasBeenPlayedByUser = _.where(pack.beatmaps, {playedByUser: true}).length > 0
                                            pack.length = moment.duration({
                                                seconds: pack.beatmaps[0].total_length
                                            }).format()

                                        });
                                        response.downloadAllLink = '/api/download/1/' + downloadAllLink.join(';') + '/';
                                        if (req.extensionsToExclude.length > 0) {
                                            response.downloadAllLink += req.extensionsToExclude.join(';')
                                        }
                                        else {
                                            response.downloadAllLink += 'none';
                                        }
                                    }
                                    rf.sendOkData(res, response);

                                });
                            }
                            else {
                                rf.sendOkData(res, response);
                            }
                        }
                    });
                })


            }
        )
    });

    app.get('/api/download/:isMultiPack/:toDownload/:extensionsToExclude', function (req, res) {

        var errorOccurred = function (message, endResponse) {
            console.error(message);
            if (false === req.isMultiPack || true === endResponse) {
                res.statusCode = 404;
                res.end();
            }
        }
        res.on('error', function (err) {
            errorOccurred('Something happend on response: ' + err.message, true);
        });

        var archive = null;
        if (true === req.isMultiPack) {
            archive = archiver('zip');
            archive.on('error', function (err) {
                errorOccurred(err, true);
            })
            archive.pipe(res);
        }
        _.each(req.toDownload, function (x) {
            x.isReady = Q.defer();
        });

        _.each(req.toDownload, function (oszFile) {
            Beatmap.find({'beatmapset_id': oszFile.beatmapSetId}, function (err, allBeatmaps) {
                if (err) {
                    errorOccurred(util.format('error while retrieving beatmaps for beatmapset %s from mongodb: %s', beatmapSet.beatmapset_id, err))
                }
                if (0 === allBeatmaps.length) {
                    errorOccurred(util.format('no beatmaps found in mongodb for beatmapset %s', beatmapSet.beatmapset_id))
                }
                else {
                    var fileName = util.format('%s %s - %s.osz', allBeatmaps[0].beatmapset_id, allBeatmaps[0].artist, allBeatmaps[0].title);
                    res.setHeader('Content-Type', 'application/octet-stream')
                    res.setHeader('Content-Disposition', contentDisposition(fileName))
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
                                    var replaceInvalidCharacters = excludedBeatmap.xFileName.replace(/[\/:*?"<>|]/g, "");
                                    var cleanExtenstion = S(replaceInvalidCharacters).left(replaceInvalidCharacters.length - 3).toString();
                                    var addExtension = cleanExtenstion + 'osu';
                                    zip.remove(addExtension);
                                });
                                if (req.extensionsToExclude.length > 0) {
                                    var fileByExtensions = {}
                                    _.each(zip.files, function (f) {
                                        var ext = path.extname(f.name);
                                        if (ext === '.jpeg') {
                                            ext = '.jpg';
                                        }
                                        if (ext !== '.osu' && ext != '.osb'
                                            && ext !== '.mp3'
                                            && ext !== '.jpg' && ext !== '.png'
                                            && ext !== '.wav'
                                            && ext !== '.avi') {
                                            ext = '.others'
                                        }
                                        if (fileByExtensions[ext] === undefined) {
                                            fileByExtensions[ext] = [];
                                        }
                                        fileByExtensions[ext].push(f.name);
                                    })
                                    _.each(req.extensionsToExclude, function (x) {
                                        if (fileByExtensions['.' + x] !== undefined) {
                                            _.each(fileByExtensions['.' + x], function (f) {
                                                zip.remove(f);
                                            })
                                        }
                                    })
                                }
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
        })


        Q.all(_.map(req.toDownload, function (f) {
            return f.isReady.promise;
        })).then(function () {
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
            else {
                res.end();
            }
        })
    });
    app.get('/api/authors', function (req, res) {
        Q.when(queryTools.searchCreators('', true, true)).then(function (creators) {
            rf.sendOkData(res, creators);
        }).catch(function (err) {
            rf.sendError(res, err.message);
        });
    });
    app.get('/api/authors/:search', function (req, res) {
        Q.when(queryTools.searchCreators(req.params.search, true, true)).then(function (creators) {
            rf.sendOkData(res, creators);
        }).catch(function (err) {
            rf.sendError(res, err.message);
        });
    });
    app.get('/api/tagsSemantic/:search', function (req, res) {
        Q.all([
            queryTools.searchCreators(req.params.search, true, true),
            queryTools.searchArtists(req.params.search, true, true),
            queryTools.searchSongs(req.params.search, true, true),
            queryTools.searchSources(req.params.search, true, true),
            queryTools.searchTags(req.params.search, true, true)
        ]).spread(function (creators, artists, songs, sources, tags) {
            var categoryIndex = 1;
            var results = {
                results: {}
            }
            categoryIndex += queryTools.addResultToTags(results, creators, 'Creators', categoryIndex);
            categoryIndex += queryTools.addResultToTags(results, artists, 'Artists', categoryIndex);
            categoryIndex += queryTools.addResultToTags(results, songs, 'Songs', categoryIndex);
            categoryIndex += queryTools.addResultToTags(results, sources, 'Sources', categoryIndex);
            categoryIndex += queryTools.addResultToTags(results, tags, 'Tags', categoryIndex);
            res.json(results);
        }, function (err) {
            res.statusCode = '500';
            res.json = err;
        })

    });
    app.post('/api/user', function (req, res) {
        User.findOne({name: req.body.pseudo}, function (err, dbUser) {
            if (dbUser === null) {
                var user = new User({
                    name: req.body.pseudo,
                    email: req.body.mail,
                    user_id: req.body.user_id,
                    resetPasswordHash: authTools.randomStringAsBase64Url(30),
                    mailVerification: authTools.randomStringAsBase64Url(27),
                    mailHasBeenVerified: false,
                    creationDate: new Date()
                });
                user.setPassword(req.body.password);

                user.save(function (err) {
                    if (err) {
                        rf.sendError(res, err.message);
                    }
                    else {
                        var link = "http://www.altosu.org/validation.html?id=" + user.mailVerification;
                        var mailOptions = {
                            from: 'altosu.org<altosu.org@gmail.com>', // sender address
                            to: req.body.mail,
                            subject: "Please confirm your Email account",
                            html: "Hello,<br> Please Click on the link to verify your email.<br><a href=" + link + ">Click here to verify</a>"
                        }
                        transporter.sendMail(mailOptions, function (error, info) {
                            if (error) {
                                rf.sendError(error.message);
                            } else {
                                rf.sendOk(res);
                            }
                        });

                    }
                });
            }
            else {
                rf.sendError(res, 'it already exist');
            }
        });
    });
    app.get('/api/user', function (req, res) {
        if (req.session.isAuthenticated === true) {
            rf.sendOkData(res, req.session.simplifiedUser);
        }
        else {
            rf.sendOkData(res, authTools.getEmptySimplifiedUser());
        }
    })
    app.get('/api/user/:userName', function (req, res) {
        User.findOne({name: req.params.userName}, {user_id: 1, difficulties: 1, modes: 1}, function (err, user) {
            if (err) rf.sendError(res, err.message);
            else {
                if (user === null) {
                    rf.sendError(res, 'Cant find the user')
                }
                else {
                    rf.sendOkData(res, user);
                }
            }
        })
    })
    app.post('/api/user/profile', function (req, res) {
        if (req.session.isAuthenticated === true) {
            User.findOneAndUpdate({name: req.session.user.name}, req.body.profile, function (err, user) {
                if (err) rf.sendError(res, err.message);
                else {
                    if (user === null) {
                        rf.sendError(res, 'Cannot found the user who owns this profile.');
                    }
                    else {
                        req.session.user = user;
                        req.session.simplifiedUser = authTools.simplifyUser(req.session.user);
                        rf.sendOk(res);
                    }
                }
            });
        }
        else {
            rf.sendError(res, 'You must authentified to save a profile')
        }
    });


    app.get('/api/user/validateEmail/:verifyCode', function (req, res) {
        User.findOne({mailVerification: req.params.verifyCode}, function (err, user) {
            if (err) {
                rf.sendError(res, err.message);
            }
            else {
                user.mailHasBeenVerified = true;
                user.save(function (err) {
                    if (err) {
                        rf.sendError(res, err.message)
                    }
                    else {
                        rf.sendOk(res);
                    }
                });
            }
        })
    })
    app.get('/api/user/sendVerificationEmail/:pseudoOrMail', function (req, res) {
        User.findOne({$or: [{name: req.params.pseudoOrMail}, {email: req.params.pseudoOrMail}]}, function (err, user) {
            if (err) {
                rf.sendError(res, err.message);
            }
            else {
                var link = "http://www.altosu.org/validation.html?id=" + user.mailVerification;
                var mailOptions = {
                    from: 'altosu.org<altosu.org@gmail.com>', // sender address
                    to: user.email,
                    subject: "Please confirm your Email account",
                    html: "Hello,<br> Please Click on the link to verify your email.<br><a href=" + link + ">Click here to verify</a>"
                }
                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        rf.sendError(res, error.message)
                    } else {
                        rf.sendOk(res);
                    }
                });
            }
        });
    })
    app.get('/api/user/sendResetPasswordLink/:mail', function (req, res) {
        User.findOne({email: req.params.mail}, function (err, user) {
            if (err) {
                rf.sendError(res, err.message);

            }
            else {
                if (user !== null) {
                    user.resetPasswordHash = authTools.randomStringAsBase64Url(30)
                    user.save(function (err) {
                        if (err) {
                            rf.sendError(res, err.message);
                        }
                        else {
                            var link = "http://www.altosu.org/resetPassword.html?id=" + user.resetPasswordHash;
                            var mailOptions = {
                                from: 'altosu.org<altosu.org@gmail.com>', // sender address
                                to: user.email,
                                subject: "Password reset",
                                html: "Hello,<br> Please Click on the link to enter a new password.<br><a href=" + link + ">Click here to enter a new password</a>"
                            }
                            transporter.sendMail(mailOptions, function (error, info) {
                                if (error) {
                                    rf.sendError(res, error.message);
                                } else {
                                    rf.sendOk(res);
                                }
                            });
                        }
                    });
                }
                else {
                    rf.sendError(res, 'Cannot found an account with this email.');
                }
            }
        });
    })
    app.get('/api/user/newPassword/:verifyCode/:newPassword', function (req, res) {
        User.findOne({resetPasswordHash: req.params.verifyCode}, function (err, user) {
            if (err) {
                rf.sendError(res, err.message);
            }
            else {
                if (user !== null) {
                    user.setPassword(req.params.newPassword);
                    user.save(function (err) {
                        if (err) {
                            rf.sendError(res, err.message);
                        }
                        else {
                            user.resetPasswordHash = authTools.randomStringAsBase64Url(30);
                            user.save();
                            rf.sendOk(res);
                        }
                    });
                }
                else {
                    rf.sendError(res, 'Cannot found an account with this procedure of reset.');
                }
            }
        });
    })
    app.get('/api/user/authenticate/:pseudoOrMail/:password', function (req, res) {
        User.findOne({$or: [{name: req.params.pseudoOrMail}, {email: req.params.pseudoOrMail}]}, function (err, user) {
            var result = {
                userFound: false,
                passwordOk: false,
                mailVerified: false,
                name: null
            }
            if (err) {
                rf.sendError(res, err.message);
            }
            else {
                if (user !== null) {
                    result.userFound = true;
                    result.name = user.name;
                    result.passwordOk = user.isValidPassword(req.params.password)
                    result.mailVerified = user.mailHasBeenVerified;
                    if (result.passwordOk) {
                        req.session.isAuthenticated = true;
                        req.session.user = user;
                        req.session.simplifiedUser = authTools.simplifyUser(user);
                        req.session.userName = user.name;
                        req.session.save();
                    }
                }
                rf.sendOkData(res, result);
            }
        });
    })
    app.delete('/api/user/logout', function (req, res) {
        req.session.destroy();
        rf.sendOk(res);
    })
    app.get('*', function (req, res) {
        res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });
};