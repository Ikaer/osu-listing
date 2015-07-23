/**
 * Created by Xavier on 01/07/2015.
 */

/*


todo: add icon when filtered on mode and difficulty

second:
todo: handle "&" in filters
todo: about page
todo: play button add stop + icon change.
todo: add detail on click
todo: add popover on difficulties
todo: clear autocomplete when value is selected
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


angular.module('MainCtrl', ['BeatmapService']).controller('MainController', ['$scope', '$location', '$state', 'Beatmap', function ($scope, $location, $state, beatmapAPI) {

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
    $scope.approved = [
        {value: 0, name: 'Pending', active: false},
        {value: 1, name: 'Ranked', active: true},
        {value: 2, name: 'Approved', active: true},
        {value: 3, name: 'Qualified', active: false},
        {value: -1, name: 'WIP', active: false},
        {value: -2, name: 'Graveyard', active: false}
    ];
    $scope.displayMode = 1;
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
        },
        approved: {
            '0': 'pending',
            '1': 'ranked',
            '2': 'approved',
            '3': 'qualified',
            '-1': 'WIP',
            '-2': 'graveyard'
        }
    };
    $scope.sorting = null;
    $scope.sortingDirection = 1;
    $scope.sortings = {
        approved: {value: 'approved_date', defaultDirection: -1},
        title: {value: 'title', defaultDirection: 1},
        artist: {value: 'artist', defaultDirection: 1},
        creator: {value: 'creator', defaultDirection: 1},
        bpm: {value: 'bpm', defaultDirection: 1},
        difficulty: {value: 'difficultyrating', defaultDirection: 1},
        playCount: {value: 'playCount', defaultDirection: -1},
        playSuccess: {value: 'playSuccess', defaultDirection: -1},
        favouritedCount: {value: 'favouritedCount', defaultDirection: -1},
        genre: {value: 'genre', defaultDirection: 1},
        language: {value: 'language', defaultDirection: 1},
        negativeUserRating: {value: 'negativeUserRating', defaultDirection: -1},
        positiveUserRating: {value: 'positiveUserRating', defaultDirection: -1},
        submitted_date: {value: 'submitted_date', defaultDirection: -1}
    };


    $scope.sort = function (sorting) {
        if ($scope.sorting === sorting.value) {
            $scope.sortingDirection = -$scope.sortingDirection;
        }
        else {
            $scope.sorting = sorting.value;
            $scope.sortingDirection = sorting.defaultDirection;
        }
        $scope.draw();
    }

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

        var templateHtml = '<div style="btn-group">';

        templateHtml += "<a type=\"button\" class=\"btn btn-primary\" target=\"_self\" href='" + beatmap.downloadLink + "'";
        templateHtml += ' download="' + beatmap.downloadName + '">';
        templateHtml += '<span class="glyphicon glyphicon-download" aria-hidden="true"></span>&nbsp;download this beatmap only';
        templateHtml += '</a>';
        templateHtml += "<a type=\"button\" class=\"btn btn-default close-popover\">";
        templateHtml += '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>&nbsp;close';
        templateHtml += '</a>';

        templateHtml += '</div>';


        $scope.currentPopover.popover({
                content: templateHtml,
                html: true,
                title: beatmap.version,
                placement: 'top'
            }
        )

        $scope.currentPopover.popover('show')
        $('.close-popover').on('click', function () {
            if ($scope.currentPopover !== null) {
                $scope.currentPopover.popover('destroy')
            }
        })
    }

    $scope.listStyle = 2;


    $scope.draw = function () {
        var filters = {
            difficulties: _.map(_.where($scope.difficulties, {active: true}), function (x) {
                return x.value;
            }),
            modes: _.map(_.where($scope.modes, {active: true}), function (x) {
                return x.value;
            }),
            approved: _.map(_.where($scope.approved, {active: true}), function (x) {
                return x.value;
            }),
            tags: {
                creator: tagTools.getTagsByType($scope.tags, 'creator'),
                artist: tagTools.getTagsByType($scope.tags, 'artist'),
                title: tagTools.getTagsByType($scope.tags, 'title')
            },
            sorting: {
                name: $scope.sorting,
                direction: $scope.sortingDirection
            },
            displayMode: $scope.displayMode
        }
        beatmapAPI.get(function (errMessage) {
            },
            function (res) {
                _.each(res.packs, function (p) {
                    p.getPercentUserRating = function () {
                        return p.positiveUserRating * 100 / (p.positiveUserRating + p.negativeUserRating);
                    }
                    p.creator = $.isArray(p.creator) ? p.creator.join(', ') : p.creator;
                })

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

    $scope.$watch('displayMode', function (newValue, oldValue) {
        if (newValue !== oldValue) {
            $scope.draw();
        }
    })
    $scope.defineView = function () {
        var viewState = ''
        switch ($scope.listStyle) {
            case 0:
                viewState = 'table';
                break;
            case 1:
                viewState = 'flex';
                break;
            case 2:
                viewState = 'cards';
                break;
        }
        console.log($scope.listStyle)
        console.log(viewState)
        $state.transitionTo('beatmaps.' + viewState);
    }
    $scope.$watch('listStyle', function (newValue, oldValue) {
        if (newValue !== oldValue) {
            $scope.defineView();
        }
    })
    $scope.defineView();

    $('.ui.search')
        .search({
            apiSettings: {
                url: '/api/tagsSemantic/{query}'
            },
            type: 'category',
            onSelect: function (result, response) {
                $scope.addTag(result.o);
            }
        });
    $('#sidebars-filter').click(function () {
        $('.ui.sidebar')
            .sidebar('toggle')
    })
    $scope.changeDifficulty = function (dValue) {
        var $control = $('#filter-difficulty-' + dValue);
        var $button = $($control.find('button'));
        var isEnabled = false;
        if ($button.hasClass('active')) {
            $button.removeClass('active')
        }
        else {
            $button.addClass('active')
            isEnabled = true;
        }
        var currentDifficilty = _.where($scope.difficulties, {value: dValue});
        _.each(currentDifficilty, function (d) {
            d.active = isEnabled;
        });
        $scope.draw();
    }
    $scope.changeMode = function (dValue) {
        var $control = $('#filter-mode-' + dValue);
        var $button = $($control.find('button'));
        var isEnabled = false;
        if ($button.hasClass('active')) {
            $button.removeClass('active')
        }
        else {
            $button.addClass('active')
            isEnabled = true;
        }
        var currentMode = _.where($scope.modes, {value: dValue});
        _.each(currentMode, function (d) {
            d.active = isEnabled;
        });
        $scope.draw();
    }

}])
;

