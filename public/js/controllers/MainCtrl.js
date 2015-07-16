/**
 * Created by Xavier on 01/07/2015.
 */
function Listingtools() {
    this.tagId = 0;
    this.difficulties = [
        {value: 1, name: 'Easy', classes:'difficulty easy'},
        {value: 2, name: 'Normal', classes:'difficulty normal'},
        {value: 3, name: 'Hard', classes:'difficulty hard'},
        {value: 4, name: 'Insane', classes:'difficulty insane'},
        {value: 5, name: 'Expert', classes:'difficulty expert'}
    ]
}
Listingtools.prototype.createTag = function (tag, type, label, classes) {
    var that = this;
    return  {
        tagId: that.tagId++,
        type: type,
        model: tag,
        label: label,
        classes:classes
    };
}
Listingtools.prototype.getTagsByType = function(tags, type){
    var selectedTags = [];
    _.each(tags, function(t){
       if(t.type === type){
           selectedTags.push(t.model);
       }
    });
    return selectedTags;
}


angular.module('MainCtrl', ['BeatmapService']).controller('MainController', ['$scope', 'Beatmap', function ($scope, beatmapAPI) {

    // todo: -trier comme la version de base du site.
    // todo: scanner un  folder local pour récupérer le listing des beatmaps du user et en faire une "playlist"

    var tagId = 0;

    var listingTools = new Listingtools();
    $scope.difficulties = listingTools.difficulties;



    $scope.converter = {
        difficulty: {
            '1': 'easy',
            '2': 'normal',
            '3': 'hard',
            '4': 'insane',
            '5': 'expert'
        },
        mode: {
            '0': 'osu',
            '1': 'taiko',
            '2': 'ctb',
            '3': 'osumania'
        }
    }

    $scope.filters = {
        pageSizes: [20, 40, 60, 80, 100],
        pageSize: 20,
        pageIndex: 0,
        tags: _.map(listingTools.difficulties, function (d) {
            return listingTools.createTag(d, 'difficulty', d.name, d.classes);
        })
    };

    $scope.addTag = function(tag, type, label, classes) {
        var newTag = listingTools.createTag(tag, type, label, classes);
        $scope.filters.tags.push(newTag);
        console.log(JSON.stringify($scope.filters.tags))
        $scope.draw();
    }

    $scope.removeTag = function (tagId) {
        $scope.filters.tags = _.reject($scope.filters.tags, function (tag) {
            return tag.tagId === tagId;
        });
        $scope.draw();
    }


    $scope.selectedCreator = null
    $scope.getCreators = function (search) {
        return beatmapAPI.getCreators(search);
    }
    $scope.addCreator = function (item) {
        $scope.addTag(item, 'creator', item.name + '(' + item.beatmapCount + ')');
        $scope.selectedCreator = null;
    }


    $scope.selectedDifficulty = null;
    $scope.getDifficulties = function () {
        var notSelectedDifficulties = [];
        var selectedDifficulties = listingTools.getTagsByType($scope.filters.tags, 'difficulty');

        _.each(listingTools.difficulties, function(d){
            if(undefined === _.find(selectedDifficulties, function(sd){
                    return sd.value === d.value;

                })){
                notSelectedDifficulties.push(d)
            }
        });

        return notSelectedDifficulties;
    }
    $scope.addDifficulty = function (item) {
        $scope.addTag(item, 'difficulty', item.name,  item.classes);
        $scope.selectedDifficulty = null;
    }





    $scope.getTagClass = function(tag){
        return tag.classes;
    }



    $scope.playBeatmap = function (beatmapId) {
        var zik = document.getElementById('player')
        zik.setAttribute('src', '/media/' + beatmapId + '/' + beatmapId + '.mp3');
        zik.play();
    }
    $scope.draw = function () {
        beatmapAPI.get(function (errMessage) {

        }, function (beatmaps) {
            $scope.packs = beatmaps;
        }, $scope.filters);
    }
    $scope.draw();
}]);

