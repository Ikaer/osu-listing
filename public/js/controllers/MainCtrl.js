/**
 * Created by Xavier on 01/07/2015.
 */
angular.module('MainCtrl', ['BeatmapService']).controller('MainController', ['$scope', 'Beatmap', function ($scope, beatmapAPI) {

    // todo: -trier comme la version de base du site.
    // todo: -reproduire les beatmap_sets
    // todo: -filtrer les beatmpat_sets à partir des filtres
    // todo: scanner un  folder local pour récupérer le listing des beatmaps du user et en faire une "playlist"

    $scope.filters = {
        difficultiesRanges: [
            {difficulty: 1, selected: true, name:'Easy' },
            {difficulty: 2, selected: true, name:'Normal' },
            {difficulty: 3, selected: true, name:'Hard' },
            {difficulty: 4, selected: true, name:'Insane' },
            {difficulty: 5, selected: true, name:'Expert' }
        ]
    };
    //beatmapAPI.get(function (errMessage) {
    //
    //}, function (beatmaps) {
    //    $scope.beatmaps = beatmaps.slice(0, 100);
    //})
    //beatmapAPI.getDifficultyRange(function (err) {
    //}, function (range) {
    //    console.log(range);
    //    for (var i = range.min; i <= range.max; i++) {
    //        $scope.filters.difficultiesRanges.push({difficulty: i, selected: true});
    //    }
    //})

    $scope.draw = function(){
        beatmapAPI.get(function (errMessage) {

        }, function (beatmaps) {
            $scope.beatmap_sets = beatmaps.slice(0, 100);
        }, $scope.filters);
    }
    $scope.draw();

    $scope.playBeatmap = function(beatmapId){
        console.log(beatmapId)
        var zik = document.getElementById('player')
        zik.setAttribute('src', 'http://b.ppy.sh/preview/' + beatmapId + '.mp3');
        zik.play();
    }
    $scope.downloadSet=function(beatmapSet){
        console.log(JSON.stringify(beatmapSet))

        var filters = {
            beatmapSet_Ids: beatmapSet.beatmapset_id ,
            beatmapIds:[]
        };
        _.each(beatmapSet.beatmaps,function(b){
            filters.beatmapIds.push(b.title);
        });
        beatmapAPI.download(filters)
    }
}]);

