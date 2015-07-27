angular.module('BeatmapAPI', []).factory('beatmapApi', ['$http', function ($http, $q) {

    return {
        // call to get all nerds
        get: function (err, fnCallbackWithData, pageIndex, pageSize, filters) {


            var myUrl = '/api/beatmaps/' + pageIndex + '/' + pageSize + '/';

            if (filters) {
                myUrl += '?f=' + encodeURIComponent( JSON.stringify(filters));
            }
            $http.get(myUrl).
                success(function (data, status, headers, config) {
                    fnCallbackWithData(data)
                }).
                error(function (data, status, headers, config) {
                    err("cannot get beatmaps");
                })
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