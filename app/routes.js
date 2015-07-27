// todo: create rss feed about creator with download link

var Beatmap = require('./models/beatmap');
var User = require('./models/user');

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

function AuthTools() {
    this.keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
}
AuthTools.prototype.encode = function (input) {
    var that = this;
    var output = "";
    var chr1, chr2, chr3 = "";
    var enc1, enc2, enc3, enc4 = "";
    var i = 0;

    do {
        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);

        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;

        if (isNaN(chr2)) {
            enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
            enc4 = 64;
        }

        output = output +
            that.keyStr.charAt(enc1) +
            that.keyStr.charAt(enc2) +
            that.keyStr.charAt(enc3) +
            that.keyStr.charAt(enc4);
        chr1 = chr2 = chr3 = "";
        enc1 = enc2 = enc3 = enc4 = "";
    } while (i < input.length);

    return output;
};
AuthTools.prototype.decode = function (input) {
    var that = this;
    var output = "";
    var chr1, chr2, chr3 = "";
    var enc1, enc2, enc3, enc4 = "";
    var i = 0;

    // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
    var base64test = /[^A-Za-z0-9\+\/\=]/g;
    if (base64test.exec(input)) {
        window.alert("There were invalid base64 characters in the input text.\n" +
            "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
            "Expect errors in decoding.");
    }
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

    do {
        enc1 = that.keyStr.indexOf(input.charAt(i++));
        enc2 = that.keyStr.indexOf(input.charAt(i++));
        enc3 = that.keyStr.indexOf(input.charAt(i++));
        enc4 = that.keyStr.indexOf(input.charAt(i++));

        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;

        output = output + String.fromCharCode(chr1);

        if (enc3 != 64) {
            output = output + String.fromCharCode(chr2);
        }
        if (enc4 != 64) {
            output = output + String.fromCharCode(chr3);
        }

        chr1 = chr2 = chr3 = "";
        enc1 = enc2 = enc3 = enc4 = "";

    } while (i < input.length);

    return output;
}

var authTools = new AuthTools();

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
            var regex = new RegExp(search, 'i');
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
QueryTools.prototype.searchGenres = function (search, sortByCount, sortIsDesc) {
    return this.searchGeneric(search, 'genre', sortByCount, sortIsDesc);
}
QueryTools.prototype.searchLanguages = function (search, sortByCount, sortIsDesc) {
    return this.searchGeneric(search, 'language', sortByCount, sortIsDesc);
}
QueryTools.prototype.searchTags = function (search, sortByCount, sortIsDesc) {
    return this.searchGeneric(search, 'tags', sortByCount, sortIsDesc);
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

var queryTools = new QueryTools();

var DownloadTools = function () {

}
DownloadTools.prototype.createToDownloadParams = function (beatmapSet, beatmaps) {
    return util.format('%s|%s', beatmapSet.beatmapset_id, _.map(beatmaps, function (b) {
        return b.beatmap_id
    }).join(','));
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

var downloadTools = new DownloadTools();

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
    app.get('/api/beatmaps/:pageIndex/:pageSize', function (req, res) {
        var filters = req.query.f ? JSON.parse(req.query.f) : null;


        var getUserDataIsDone = Q.defer();
        if (req.headers.authorization !== undefined) {
            try {
                var decodedData = authTools.decode(req.headers.authorization.replace('Basic ', ''));
                var userData = decodedData.split(':');
                User.findOne({name: userData[0]}, function (err, user) {
                    if (user !== null && user.isValidPassword(userData[1])) {
                        getUserDataIsDone.resolve(user);
                    }
                    else {
                        getUserDataIsDone.resolve(null);
                    }
                });
            }
            catch (e) {
                getUserDataIsDone.resolve(null);
            }
        }
        else {
            getUserDataIsDone.resolve(null);
        }

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
        queryToGetdIds.limit(req.pageSize);
        queryToGetdIds.options = {allowDiskUse: true};
        queryToGetdIds.exec(function (err, packs) {
            var response = {
                packs: [],
                downloadAllLink: null
            }
            if (err) {
                res.send(response);
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
                            downloadAllLink: null
                        }
                        if (err) {
                            res.send(response);
                        }
                        else {
                            response.packs = packs;
                            var downloadAllLink = [];
                            _.each(response.packs, function (pack) {
                                queryTools.normalizeData(pack);
                                if (filters.displayMode === 0) {
                                    pack.beatmapsIds = [pack.beatmap_id];
                                    pack.beatmaps = [JSON.parse(JSON.stringify(pack))];
                                }


                                var fileName = util.format('%s %s - %s.osz', pack.beatmaps[0].beatmapset_id, pack.beatmaps[0].artist, pack.beatmaps[0].title);

                                var toDownloadParam = downloadTools.createToDownloadParams(pack, pack.beatmaps)
                                downloadAllLink.push(toDownloadParam);
                                pack.downloadLink = '/api/download/0/' + toDownloadParam;
                                pack.downloadName = fileName;
                                _.each(pack.beatmaps, function (beatmap) {


                                    var replaceInvalidCharacters = beatmap.xFileName.replace(/[\/:*?"<>|.]/g, "");
                                    var cleanExtenstion = S(replaceInvalidCharacters).left(replaceInvalidCharacters.length - 3).toString();
                                    fileName = cleanExtenstion + '.osz';
                                    beatmap.downloadLink = '/api/download/0/' + downloadTools.createToDownloadParams(pack, [beatmap]);
                                    beatmap.downloadName = fileName;
                                })
                            });
                            response.downloadAllLink = '/api/download/1/' + downloadAllLink.join(';');
                            Q.when(getUserDataIsDone.promise).then(function (user) {
                                if (user != null) {
                                    console.log('user is ' + user.name)
                                }
                                else {
                                    console.log('anonymous user');
                                }
                                res.json(response);
                            });
                        }
                    });
                }
                else {
                    res.json(response);
                }
            }
        });

    });
    app.get('/api/download/:isMultiPack/:toDownload', function (req, res) {

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
            var that = this;
            var result = {
                created: false,
                reason: null
            }
            if (dbUser === null) {
                var user = new User({
                    name: req.body.pseudo,
                    email: req.body.mail
                });
                user.setPassword(req.body.password);

                user.save(function (err, result) {
                    if (err) {
                        res.json({
                            created: false,
                            reason: err
                        });
                    }
                    else {
                        res.json({
                            created: true,
                            reason: null
                        });
                    }
                });
            }
            else {
                result.reason = 'already exist';
                res.json(result);
            }
        });
    });
    app.get('/api/user/authenticate/:pseudoOrMail/:password', function (req, res) {
        User.findOne({name: req.params.pseudoOrMail}, function (err, user) {
            var result = {
                userFound: false,
                passwordOk: false,
                name: null,
                error: null
            }
            if (err) {
                result.error = err;
                res.json(result);
            }
            else {
                if (null === user) {
                    User.findOne({email: req.params.pseudoOrMail}, function (err, user) {
                        var result = {
                            userFound: false,
                            passwordOk: false,
                            error: null
                        }
                        if (err) result.error = err;
                        else {
                            if (null !== user) {
                                result.name = user.name;
                                result.userFound = true;
                                result.passwordOk = user.isValidPassword(req.params.password)
                            }
                        }
                        res.json(result);
                    });
                }
                else {
                    result.userFound = true;
                    result.name = user.name;
                    result.passwordOk = user.isValidPassword(req.params.password)
                    res.json(result);
                }
            }
        });
    })
    app.get('*', function (req, res) {
        res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });


}
;