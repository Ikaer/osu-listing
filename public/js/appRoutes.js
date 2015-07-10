/**
 * Created by Xavier on 01/07/2015.
 */
angular.module('appRoutes', []).config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {

    $routeProvider

        // home page
        .when('/', {
            templateUrl: 'views/main.html',
            controller: 'MainController'
        })

    $locationProvider.html5Mode(true);

}]);