/**
 * Created by Xavier on 01/07/2015.
 */

function ListingConstants() {
    this.modes = [
        {value: 0, name: 'Osu!', active: true},
        {value: 1, name: 'Taiko', active: true},
        {value: 2, name: 'Catch the beat', active: true},
        {value: 3, name: 'Osu!Mania', active: true}
    ]
    this.difficulties = [
        {value: 1, name: 'Easy', active: true},
        {value: 2, name: 'Normal', active: true},
        {value: 3, name: 'Hard', active: true},
        {value: 4, name: 'Insane', active: true},
        {value: 5, name: 'Expert', active: true}
    ];
    this.pageSizes = [10, 20, 50, 100, 200];
    this.converter = {
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
    };
}

function TagTools() {
    this.tagId = 0;
}
TagTools.prototype.createTag = function (tag) {
    var that = this;
    tag.tagId = that.tagId++;
    return tag;
}
TagTools.prototype.getTagsByType = function (tags, type) {
    var selectedTags = [];
    _.each(tags, function (t) {
        if (t.type === type) {
            selectedTags.push(t.value);
        }
    });
    return selectedTags;
}


angular.module('MainCtrl', ['BeatmapService']).controller('MainController', ['$scope', 'Beatmap', function ($scope, beatmapAPI) {

    // todo: -trier comme la version de base du site.
    // todo: scanner un  folder local pour récupérer le listing des beatmaps du user et en faire une "playlist"


    var tagTools = new TagTools();
    $scope.constants = new ListingConstants();


    $scope.pageSize = 20;
    $scope.pageIndex = 0;
    $scope.tags = _.map(tagTools.difficulties, function (d) {
        return tagTools.createTag(d, 'difficulty', d.name, d.classes);
    })


    $scope.addTag = function (tag) {
        var newTag = tagTools.createTag(tag);
        $scope.selectedTag = null;
        $scope.tags.push(newTag);
        console.log(JSON.stringify($scope.tags))
        $scope.draw();
    }

    $scope.removeTag = function (tagId) {
        $scope.tags = _.reject($scope.tags, function (tag) {
            return tag.tagId === tagId;
        });
        $scope.draw();
    }


    $scope.selectedTag = null
    $scope.getTags = function (search) {
        return beatmapAPI.getTags(search);
    }

    //$scope.getTagClass = function (tag) {
    //    return tag.classes;
    //}

    $scope.playBeatmap = function (beatmapId) {
        var zik = document.getElementById('player')
        zik.setAttribute('src', '/media/' + beatmapId + '/' + beatmapId + '.mp3');
        zik.play();
    };

    $scope.checkModel = [{"active": true, "name": "left"}, {"active": false, "name": "right"}, {
        "active": true,
        "name": "center"
    }]

    $scope.draw = function () {
        console.log('calling draw')
        var filters = {
            difficulties: _.map(_.where($scope.constants.difficulties, {active: true}), function (difficulty) {
                return difficulty.value;
            }),
            modes: _.map(_.where($scope.constants.modes, {active: true}), function (mode) {
                return mode.value;
            }),
            tags :{
                creator: tagTools.getTagsByType($scope.tags, 'creator'),
                artist: tagTools.getTagsByType($scope.tags, 'artist'),
                title: tagTools.getTagsByType($scope.tags, 'title')
            }
        }
        beatmapAPI.get(function (errMessage) {
            },
            function (beatmaps) {
                $scope.packs = beatmaps;
            },
            $scope.pageIndex,
            $scope.pageSize,
            filters);
    }
    $scope.draw();


    $scope.foo = function () {
        console.log('foo');
    }
}]);

