/**
 * Created by Xavier on 01/07/2015.
 */
angular.module('BeatmapService', []).factory('Beatmap', ['$http', function ($http) {
    return {
        // call to get all nerds
        get: function (err, fnCallbackWithData, filters) {

            var url = '/api/beatmaps';
            if (filters) {
                var urlFilter = {};
                if (filters.difficultiesRanges && filters.difficultiesRanges.length > 0) {
                    var selectedFilters = _.where(filters.difficultiesRanges, {selected: true});
                    urlFilter.difficulties = _.map(selectedFilters, function (dr) {
                        return dr.difficulty;
                    })

                }

                // dummy
                urlFilter.groupBy = ['difficulty']


                if (JSON.stringify(urlFilter) !== '{}') {
                    url += '?f=' + JSON.stringify(urlFilter);
                }
                console.log(url);
            }

            $http.get(url).
                success(function (data, status, headers, config) {
                    // this callback will be called asynchronously
                    // when the response is available
                    fnCallbackWithData(data)
                }).
                error(function (data, status, headers, config) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                    err("cannot get beatmaps");
                })
        },
        getDifficultyRange: function (err, cb) {
            $http.get('/api/difficultyRatingRange').
                success(function (data) {
                    cb(data);
                }).
                error(function (data) {

                });
        },
        download: function(beatmapSets){
            var url = '/api/beatmaps/download';
            url += '?f=' + JSON.stringify(beatmapSets);
            console.log(url);
            $http.get(url).
                success(function (data, status, headers, config) {
                    // this callback will be called asynchronously
                    // when the response is available
                    fnCallbackWithData(data)
                }).
                error(function (data, status, headers, config) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                    err("cannot get beatmaps");
                })
        }
    }
}]);