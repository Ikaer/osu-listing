angular.module('BeatmapAPI', []).factory('beatmapApi', ['$http', function ($http, $q) {

    return {
        // call to get all nerds
        get: function (err, fnCallbackWithData, pageIndex, pageSize, filters) {


            var url = '/api/beatmaps/' + pageIndex + '/' + pageSize + '/';

            if (filters) {
                url += '?f=' + JSON.stringify(filters);
            }
            $http.get(url).
                success(function (data, status, headers, config) {
                    fnCallbackWithData(data)
                }).
                error(function (data, status, headers, config) {
                    err("cannot get beatmaps");
                })
        },
        getTags: function (search) {
            var url = '/api/tags/' + search;
            return $http.get(url).then(function (response) {
                return response.data;
            });
        },
        createUser: function (pseudo, password, mail, fnOk, fnErr) {
            var url = '/api/user'
            $http.post(url, {pseudo: pseudo, password: password, mail: mail}).then(function (response) {
                if (response.created === true) {
                    fnOk(response);
                }
                else {
                    fnErr(response);
                }
            })
        },
        authenticateUser:function(pseudoOrMail, password, fnOk, fnKo){
            var url = '/api/user/authenticate/'+pseudoOrMail+'/' + password;
            $http.get(url).success(function(data){
                if(true === data.passwordOk){
                    fnOk(data)
                }
                else{
                    fnKo(data);
                }
            });
        }
    }
}]);