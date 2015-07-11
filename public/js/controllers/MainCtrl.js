/**
 * Created by Xavier on 01/07/2015.
 */
angular.module('MainCtrl', ['BeatmapService']).controller('MainController', ['$scope', 'Beatmap', function ($scope, beatmapAPI) {

    // todo: -trier comme la version de base du site.
    // todo: scanner un  folder local pour récupérer le listing des beatmaps du user et en faire une "playlist"

    $scope.converter ={
        difficulty:{
            '1': 'easy',
            '2': 'normal',
            '3': 'hard',
            '4': 'insane',
            '5': 'expert'
        },
        mode:{
            '0' : 'osu',
            '1' : 'taiko',
            '2' : 'ctb',
            '3' : 'osumania'
        }
    }

    $scope.filters = {
        difficultiesRanges: [
            {difficulty: 1, selected: true, name:'Easy' },
            {difficulty: 2, selected: true, name:'Normal' },
            {difficulty: 3, selected: true, name:'Hard' },
            {difficulty: 4, selected: true, name:'Insane' },
            {difficulty: 5, selected: true, name:'Expert' }
        ],
        pageSizes:[20, 40, 60, 80, 100],
        pageSize:20,
        pageIndex: 0
    };

    $scope.draw = function(){
        beatmapAPI.get(function (errMessage) {

        }, function (beatmaps) {
            $scope.packs = beatmaps;
        }, $scope.filters);
    }
    $scope.draw();

    $scope.playBeatmap = function(beatmapId){
        console.log(beatmapId)
        var zik = document.getElementById('player')
        zik.setAttribute('src', 'http://b.ppy.sh/preview/' + beatmapId + '.mp3');
        zik.play();
    }

}]);

