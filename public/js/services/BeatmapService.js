/**
 * Created by Xavier on 01/07/2015.
 */




angular.module('BeatmapService', []).factory('Beatmap', ['$http', function ($http, $q) {

    return {
        // call to get all nerds
        get: function (err, fnCallbackWithData, pageIndex, pageSize, filters) {


            var url = '/api/beatmaps/' + pageIndex + '/' + pageSize + '/';

            if (filters) {
                url += '?f=' + JSON.stringify(filters);
            }
            console.log(url);
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
        },
        getTags: function (search) {
            var url = '/api/tags/' + search;
            return $http.get(url).then(function (response) {
                return response.data;
            });
        }
    }
}]);