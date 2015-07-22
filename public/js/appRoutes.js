/**
 * Created by Xavier on 01/07/2015.
 */
angular.module('appRoutes', []).config(['$routeProvider', '$locationProvider',
    function ($routeProvider, $locationProvider) {


        $routeProvider.when('/', {
            templateUrl: 'views/main.html',
            controller: 'MainController'
        }).otherwise({
            redirectTo: '/'
        });

        $locationProvider.html5Mode(true);

    }]);