/**
 * Created by Xavier on 01/07/2015.
 */
angular.module('BeatmapModule', []).controller('BeatmapController',['$scope', function($scope) {
    $scope.beatmap = $scope.beatmaps[$scope.$index];
    console.log($scope.beatmap.title)
}]);
