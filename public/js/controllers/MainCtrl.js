/**
 * Created by Xavier on 01/07/2015.
 */


/*
 todo: handle "&" in filters
 todo: loader creating packs / download
 todo: clean bootstrap code and files.
 todo: use popup module on click on card.
 todo: add icon when filtered on mode and difficulty
 todo: scanner un folder local pour récupérer le listing des beatmaps du user et en faire une "playlist"
 todo: about page
 todo: play button add stop + icon change.
 todo: add popover on difficulties
 todo: clear autocomplete when value is selected
 todo: add source, tags, language, type in autocomplete + click in card to directly add tags
 todo: for tags add a length ponderation (for exemple "on" is better than "one" when user type "on")
 todo: put information in black vs title in card.
 todo: (maybe limit to 16 cards, 1080 screen).
 todo: add button to move next / previous (do a .limit(-/+1) to know if there is next beatmap or previous)
 todo: disabled cursor:action on card until there is something.
 todo: add settings in sidenav
 todo: add beatmap or beatmapset in sidenav
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


    $scope.loading = true;
    $scope.notLoading = false;
    showLoading();
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

    $scope.sortings = {
        approved: {label: 'Approved date', value: 'approved_date', direction: -1},
        title: {label: 'Title', value: 'title', direction: 1},
        artist: {label: 'Artist', value: 'artist', direction: 1},
        creator: {label: 'Creator', value: 'creator', direction: 1},
        bpm: {label: 'BPM', value: 'bpm', direction: 1},
        difficulty: {label: 'Difficulty', value: 'difficultyrating', direction: 1, single: true},
        playCount: {label: 'Plays', value: 'playCount', direction: -1},
        playSuccess: {label: 'Plays failed', value: 'playSuccess', direction: -1},
        favouritedCount: {label: 'Favourites', value: 'favouritedCount', direction: -1},
        negativeUserRating: {label: 'Negative user ratings', value: 'negativeUserRating', direction: -1},
        positiveUserRating: {label: 'Positive user ratings', value: 'positiveUserRating', direction: -1},
        submitted_date: {label: 'Submitted date', value: 'submitted_date', direction: -1},
        last_update: {label: 'Last update', value: 'last_update', direction: -1}
    };
    $scope.sorting = $scope.sortings.approved;
    $scope.changeSortingDirection = function () {
        $scope.sorting.direction = -$scope.sorting.direction;
        $scope.draw();
    }
    $scope.sort = function (sorting) {
        if ($scope.sorting.value !== sorting.value) {
            $scope.sorting = sorting;
            $scope.sortingDirection = $scope.sorting.direction;
            $scope.draw();
        }
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

    function showLoading() {
        $('.ao-loader').addClass('active');
    }

    function hideLoading() {
        $('.ao-loader').removeClass('active');
    }

    $scope.draw = function () {
        showLoading();
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
                name: $scope.sorting.value,
                direction: $scope.sorting.direction
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

                hideLoading();
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
        $state.transitionTo('beatmaps.' + viewState);
    }
    $scope.$watch('listStyle', function (newValue, oldValue) {
        if (newValue !== oldValue) {
            $scope.defineView();
        }
    })
    $scope.defineView();

    $('.ui.search').search({
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
        var currentDifficilty = _.where($scope.difficulties, {value: dValue});
        _.each(currentDifficilty, function (d) {
            d.active = !d.active;
        });
        $scope.draw();
    }
    $scope.changeMode = function (dValue) {
        var currentMode = _.where($scope.modes, {value: dValue});
        _.each(currentMode, function (d) {
            d.active = !d.active;
        });
        $scope.draw();
    }
    $scope.changeApproved = function (dValue) {
        var currentApproved = _.where($scope.approved, {value: dValue});
        _.each(currentApproved, function (d) {
            d.active = !d.active;
        });
        var currentApprovedChecked = _.where($scope.approved, {active: true});
        if((
            currentApprovedChecked.length === 2
            && (currentApprovedChecked[0].value === -1 && currentApprovedChecked[1].value === -2)
            )
            ||
            (currentApprovedChecked.length === 1
                && (currentApprovedChecked[0].value === -1 || currentApprovedChecked[0].value === -2)
            )
        ){
            $scope.sort($scope.sortings.last_update);
        }
        $scope.draw();
    }
    $scope.bindCardsEvents = function(){
        $('.ao-beatmap-image-container').dimmer({
            on: 'hover'
        });
        $("img").error(function () {
            $(this).hide();
            // or $(this).css({visibility:"hidden"});
        });
    }
}])
;

