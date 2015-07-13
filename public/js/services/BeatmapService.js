/**
 * Created by Xavier on 01/07/2015.
 */




angular.module('BeatmapService', []).factory('Beatmap', ['$http', function ($http, $q) {

    return {
        // call to get all nerds
        get: function (err, fnCallbackWithData, filters) {

            var url = '/api/beatmaps/' + filters.pageIndex + '/' + filters.pageSize + '/';
            if (filters) {
                var urlFilter = {};
                if (filters.difficultiesRanges && filters.difficultiesRanges.length > 0) {
                    var selectedFilters = _.where(filters.difficultiesRanges, {selected: true});
                    urlFilter.difficulties = _.map(selectedFilters, function (dr) {
                        return dr.difficulty;
                    })
                }

                urlFilter.tags = filters.tags;


                //urlFilter.groupBy = ['difficulty']

                if (JSON.stringify(urlFilter) !== '{}') {
                    url += '?f=' + JSON.stringify(urlFilter);
                }

            }

            $http.get(url).
                success(function (data, status, headers, config) {
                    fnCallbackWithData(data)
                }).
                error(function (data, status, headers, config) {
                    err("cannot get beatmaps");
                })
        },
        getCreators: function (search) {
            var url = search === '' ? '/api/authors' : '/api/authors/' + search;
            return $http.get(url).then(function (response) {
                return response.data;
            });
        }
    }
}]);