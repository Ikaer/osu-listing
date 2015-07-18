/**
 * Created by Xavier on 01/07/2015.
 */

function ListingConstants($routeParams) {
    var that = this;

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


angular.module('MainCtrl', ['BeatmapService']).controller('MainController', ['$scope', '$location', '$routeParams', 'Beatmap', function ($scope, $location, $routeParams, beatmapAPI) {

    // todo: -trier comme la version de base du site.
    // todo: scanner un  folder local pour récupérer le listing des beatmaps du user et en faire une "playlist"


    var tagTools = new TagTools();

    $scope.modes = [
        {value: 0, name: 'Osu!', active: true},
        {value: 1, name: 'Taiko', active: true},
        {value: 2, name: 'Catch the beat', active: true},
        {value: 3, name: 'Osu!Mania', active: true}
    ]
    $scope.difficulties = [
        {value: 1, name: 'Easy', active: true},
        {value: 2, name: 'Normal', active: true},
        {value: 3, name: 'Hard', active: true},
        {value: 4, name: 'Insane', active: true},
        {value: 5, name: 'Expert', active: true}
    ];


    $scope.pageSizes = [10, 20, 50, 100, 200];
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
    };
    $scope.sorting = 0;
    $scope.sortingDirection = -1;
    $scope.sortings = [
        {value: 0, name: 'last ranked'},
        {value: 1, name: 'title'},
        {value: 2, name: 'artist'},
        {value: 3, name: 'creator'}
    ]

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

    $scope.playBeatmap = function (beatmapId) {
        var zik = document.getElementById('player')
        zik.setAttribute('src', '/media/' + beatmapId + '/' + beatmapId + '.mp3');
        zik.play();
    };


    $scope.downloadAllLink = null;

    $scope.currentPopover = null;
    $scope.showBeatmap = function (beatmap) {
        if ($scope.currentPopover !== null) {
            $scope.currentPopover.popover('destroy')
        }
        $scope.currentPopover = $('#popover-' + beatmap.beatmap_id);

        var templateHtml = '<div style="">';

        templateHtml += "<a type=\"button\" class=\"btn btn-default\" target=\"_self\" href='" + beatmap.downloadLink + "'";
        templateHtml += ' download="' + beatmap.downloadName + '">';
        templateHtml += '<span class="glyphicon glyphicon-download" aria-hidden="true"></span>&nbsp;download this beatmap only';
        templateHtml += '</a>';


        templateHtml += '</div>';



        $scope.currentPopover.popover({
                content:templateHtml,
                html:true,
                title: beatmap.version,
                placement:'top'
            }
        )
        $scope.currentPopover.popover('show')
    }


    $scope.draw = function () {
        var filters = {
            difficulties: _.map(_.where($scope.difficulties, {active: true}), function (difficulty) {
                return difficulty.value;
            }),
            modes: _.map(_.where($scope.modes, {active: true}), function (mode) {
                return mode.value;
            }),
            tags: {
                creator: tagTools.getTagsByType($scope.tags, 'creator'),
                artist: tagTools.getTagsByType($scope.tags, 'artist'),
                title: tagTools.getTagsByType($scope.tags, 'title')
            },
            sorting: {
                name: $scope.sorting,
                direction: $scope.sortingDirection
            }
        }
        beatmapAPI.get(function (errMessage) {
            },
            function (res) {
                $scope.packs = res.packs;
                $scope.downloadAllLink = res.downloadAllLink;
            },
            $scope.pageIndex,
            $scope.pageSize,
            filters);

    }
    $scope.draw();


    $scope.foo = function () {
        console.log('foo');
    }


}])
;

