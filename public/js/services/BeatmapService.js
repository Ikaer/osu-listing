angular.module('BeatmapAPI', []).factory('beatmapApi', ['$http', function ($http, $q) {

    return {
        // call to get all nerds
        get: function (err, fnCallbackWithData, pageIndex, pageSize, filters) {


            var myUrl = '/api/beatmaps/' + pageIndex + '/' + pageSize + '/';

            if (filters) {
                myUrl += '?f=' + encodeURIComponent(JSON.stringify(filters));
            }
            $http.get(myUrl).
                success(function (data, status, headers, config) {
                    fnCallbackWithData(data)
                }).
                error(function (data, status, headers, config) {
                    err("cannot get beatmaps");
                })
        },
        createUser: function (pseudo, password, mail, user_id, fnOk, fnErr) {
            var url = '/api/user'
            $http.post(url, {
                pseudo: pseudo,
                password: password,
                mail: mail,
                user_id: user_id
            }).then(function (response) {
                if (response.data.created === true) {
                    fnOk(response.data);
                }
                else {
                    fnErr(response.data);
                }
            })
        },
        authenticateUser: function (pseudoOrMail, password, fnOk, fnKo) {
            var url = '/api/user/authenticate/' + pseudoOrMail + '/' + password;
            $http.get(url).success(function (data) {
                fnOk(data)

            });
        },
        resendEmail: function (pseudoOrMail, fnOk) {
            var url = '/api/user/sendVerificationEmail/' + pseudoOrMail;
            $http.get(url).success(function (data) {
                fnOk(data)
            });
        }
    }
}]);