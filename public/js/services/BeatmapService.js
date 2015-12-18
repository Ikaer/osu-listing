angular.module('BeatmapAPI', []).factory('beatmapApi', ['$http', function ($http, $q) {

    return {
        // call to get all nerds
        get: function (err, fnCallbackWithData, pageIndex, pageSize, filters, extensionsToExclude) {


            var myUrl = '/api/beatmaps/' + pageIndex + '/' + pageSize + '/false/';
            var rssUrl = '/api/beatmaps/' + pageIndex + '/' + pageSize + '/true/';
            if (extensionsToExclude && extensionsToExclude.length > 0) {
                myUrl += extensionsToExclude.join(';')
                rssUrl += extensionsToExclude.join(';')
            }
            else {
                myUrl += 'none';
                rssUrl += 'none';
            }
            if (filters) {
                myUrl += '?f=' + encodeURIComponent(JSON.stringify(filters));
                rssUrl += '?f=' + encodeURIComponent(JSON.stringify(filters));
            }
            $http.get(myUrl).
            success(function (response) {
                if (response.ok) {
                    response.data.rssfeed = rssUrl;
                    fnCallbackWithData(response.data)
                }
                else {
                    err(response.message);
                }
            }).
            error(function () {
                err("cannot get beatmaps");
            })
        },
        search: function (err, fnCallbackWithData, search) {
            var myUrl = '/api/tagsSemantic/' + search;
            $http.get(myUrl).
            success(function (response) {
                if (response.ok) {
                    fnCallbackWithData(response.data)
                }
                else {
                    err(response.message);
                }
            }).
            error(function () {
                err("Cannot get search results");
            })

        },
        searchYouTube: function (err, fnCallbackWithData, beatmapId) {
            var myUrl = '/api/youtube/' + beatmapId
            $http.get(myUrl).
            success(function (response) {
                if (response.ok) {
                    fnCallbackWithData(response.data)
                }
                else {
                    err(response.message);
                }
            }).
            error(function () {
                err("Cannot get search results");
            })

        },

        createUser: function (pseudo, password, mail, user_id, fnOk, fnKo) {
            var url = '/api/user'
            $http.post(url, {
                pseudo: pseudo,
                password: password,
                mail: mail,
                user_id: user_id
            }).then(function (response) {
                if (response.data.ok) {
                    fnOk();
                }
                else {
                    fnKo(response.data.message);
                }
            })
        },
        authenticateUser: function (pseudoOrMail, password, fnOk, fnKo) {
            var url = '/api/user/authenticate/' + pseudoOrMail + '/' + password;
            $http.get(url).success(function (response) {
                if (response.ok) {
                    fnOk(response.data);
                }
                else {
                    fnKo(response.message)
                }
            });
        },
        logoutUser: function (callback) {
            var url = '/api/user/logout';
            $http.delete(url).success(function () {
                callback()
            });
        },
        resendEmail: function (pseudoOrMail, fnOk, fnKo) {
            var url = '/api/user/sendVerificationEmail/' + pseudoOrMail;
            $http.get(url).success(function (response) {
                if (response.ok) {
                    fnOk();
                }
                else {
                    fnKo(response.message);
                }
            });
        },
        resetPassword: function (mail, fnOk, fnKo) {
            var url = '/api/user/sendResetPasswordLink/' + mail;
            $http.get(url).success(function (response) {
                if (response.ok) {
                    fnOk()
                }
                else {
                    fnKo(response.message);
                }
            });
        },
        saveProfile: function (profile, fnOk, fnKo) {
            var url = '/api/user/profile';
            $http.post(url, {
                profile: profile
            }).then(function (response) {
                if (response.data.ok) {
                    fnOk()
                }
                else {
                    fnKo(response.data.message);
                }
            })
        }
    }
}])
;