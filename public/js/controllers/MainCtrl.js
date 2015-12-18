/**
 * Created by Xavier on 01/07/2015.
 */


/*
 todo: loader creating packs / download
 todo: use popup module on click on card.
 todo: add icon when filtered on mode and difficulty
 todo: about page
 todo: play button add stop + icon change.
 todo: add popover on difficulties
 todo: clear autocomplete when value is selected
 todo: for tags add a length ponderation (for exemple "on" is better than "one" when user type "on")
 todo: (maybe limit to 16 cards, 1080 screen).
 todo: add settings in sidenav
 todo: add beatmap or beatmapset in sidenav
 */

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

angular.module('MainCtrl', ['BeatmapAPI', 'Authentication', 'ngUrlBind']).controller('MainController', ['$rootScope', '$scope', '$location', '$state', 'beatmapApi', 'AuthenticationService', 'userLoader', 'ngUrlBind', function ($rootScope, $scope, $location, $state, beatmapApi, authService, userLoader, ngUrlBind) {


    /*
     isAuthenticated: false,
     name: 'anonymous',
     difficulties: [1, 2, 3, 4, 5],
     modes: [0, 1, 2, 3],
     user_id:null

     */

    $scope.user = userLoader.data.data;
    $scope.loading = true;
    $scope.notLoading = false;
    showLoading();
    var tagTools = new TagTools();

    function findValueInUserProfile(name, value) {
        return _.find($scope.user[name], function (x) {
                return x === value;
            }) !== undefined;
    }


    $scope.extensions = [
        {
            value: 'osu',
            name: '*.osu file(s)',
            active: !findValueInUserProfile('fileExtensionsToExclude', 'osu'),
            init: true
        },
        {
            value: 'mp3',
            name: '*.mp3 file(s)',
            active: !findValueInUserProfile('fileExtensionsToExclude', 'mp3'),
            init: true
        },
        {
            value: 'jpg',
            name: '*.jpg file(s)',
            active: !findValueInUserProfile('fileExtensionsToExclude', 'jpg'),
            init: true
        },
        {
            value: 'osb',
            name: '*.osb file(s) - contains beatmaps storyboard information',
            active: !findValueInUserProfile('fileExtensionsToExclude', 'osb'),
            init: true
        },
        {
            value: 'png',
            name: '*.png file(s)',
            active: !findValueInUserProfile('fileExtensionsToExclude', 'png'),
            init: true
        },
        {
            value: 'wav',
            name: '*.wav file(s)',
            active: !findValueInUserProfile('fileExtensionsToExclude', 'wav'),
            init: true
        },
        {
            value: 'avi',
            name: '*.avi file(s)',
            active: !findValueInUserProfile('fileExtensionsToExclude', 'avi'),
            init: true
        },
        {
            value: 'others',
            name: 'Any file extension other than the one listed above',
            active: !findValueInUserProfile('fileExtensionsToExclude', 'others'),
            init: true
        }
    ]
    $scope.e = {};
    _.each($scope.extensions, function (m, i) {
        $scope.e[i] = m.active ? 1 : 0;
        $scope.$watch('extensions[' + i + '].active', function (newVal, oldVal) {
            if (oldVal !== newVal) {
                $scope.e[i] = newVal ? 1 : 0;
                $scope.draw();
            }
        })
        $scope.$watch('e[' + i + ']', function (newVal, oldVal) {
            var isActive = newVal === 1;
            if (m.active !== isActive) {
                m.active = isActive;
            }
        })
        m.init = m.active;
    })
    ngUrlBind($scope, 'e');


    $scope.playedBeatmaps = [
        {value: 0, name: 'all of them'},
        {value: 1, name: 'only the ones I\'ve never played any difficulty in it'},
        {value: 2, name: 'only the ones I\'ve at least one difficulty in it'}
    ]
    $scope.pbv = $scope.user.playedBeatmaps;
    $scope.$watch('pbv', function (newVal, oldVal) {
        if (newVal !== oldVal) {
            $scope.draw();
        }
    })
    ngUrlBind($scope, 'pbv');


    // MODES management
    $scope.modes = [
        {value: 0, name: 'Osu!', active: findValueInUserProfile('modes', 0), init: false},
        {value: 1, name: 'Taiko', active: findValueInUserProfile('modes', 1), init: false},
        {value: 2, name: 'Catch the beat', active: findValueInUserProfile('modes', 2), init: false},
        {value: 3, name: 'Osu!Mania', active: findValueInUserProfile('modes', 3), init: false}
    ]
    $scope.m = {};
    _.each($scope.modes, function (m, i) {
        $scope.m[i] = m.active ? 1 : 0;
        $scope.$watch('modes[' + i + '].active', function (newVal, oldVal) {
            if (oldVal !== newVal) {
                $scope.m[i] = newVal ? 1 : 0;
                $scope.draw();
            }
        })
        $scope.$watch('m[' + i + ']', function (newVal, oldVal) {
            var isActive = newVal === 1;
            if (m.active !== isActive) {
                m.active = isActive;
            }
        })
        m.init = m.active;
    })
    ngUrlBind($scope, 'm');


    $scope.difficulties = [
        {value: 1, name: 'Easy', active: findValueInUserProfile('difficulties', 1), init: false},
        {value: 2, name: 'Normal', active: findValueInUserProfile('difficulties', 2), init: false},
        {value: 3, name: 'Hard', active: findValueInUserProfile('difficulties', 3), init: false},
        {value: 4, name: 'Insane', active: findValueInUserProfile('difficulties', 4), init: false},
        {value: 5, name: 'Expert', active: findValueInUserProfile('difficulties', 5), init: false}
    ];
    $scope.d = {}
    _.each($scope.difficulties, function (d, i) {
        $scope.d[i] = d.active ? 1 : 0;
        $scope.$watch('difficulties[' + i + '].active', function (newVal, oldVal) {
            if (oldVal !== newVal) {
                $scope.d[i] = newVal ? 1 : 0;
                $scope.draw();
            }
        })
        $scope.$watch('d[' + i + ']', function (newVal) {
            var isActive = newVal === 1;
            if (d.active !== isActive) {
                d.active = isActive;
            }
        })
        d.init = d.active;
    })
    ngUrlBind($scope, 'd');
    $scope.approved = [
        {value: 0, name: 'Pending', active: false},
        {value: 1, name: 'Ranked', active: true},
        {value: 2, name: 'Approved', active: true},
        {value: 3, name: 'Qualified', active: false},
        {value: -1, name: 'WIP', active: false},
        {value: -2, name: 'Graveyard', active: false}
    ];
    $scope.a = {}
    _.each($scope.approved, function (a, i) {
        $scope.a[i] = a.active ? 1 : 0;
        $scope.$watch('approved[' + i + '].active', function (newVal, oldVal) {
            if (oldVal !== newVal) {
                $scope.a[i] = newVal ? 1 : 0;
                $scope.draw();
            }
        })
        $scope.$watch('a[' + i + ']', function (newVal) {
            var isActive = newVal === 1;
            if (a.active !== isActive) {
                a.active = isActive;
            }
        })
    })
    ngUrlBind($scope, 'a');

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
    $scope.s = {'c': $scope.user.sorting, 'd': $scope.user.sortingDirection};

    $scope.$watch('sorting', function (newVal, oldVal) {
        if (newVal !== oldVal) {
            $scope.s = {'c': $scope.sorting.value, 'd': $scope.sorting.direction};
            $scope.draw();
        }
    })
    $scope.$watch('sorting.direction', function (newVal, oldVal) {
        if (newVal !== oldVal) {
            $scope.s = {'c': $scope.sorting.value, 'd': $scope.sorting.direction};
            $scope.draw();
        }
    })
    $scope.$watch('s.c', function (newVal) {
        if (newVal !== $scope.sorting.value) {
            for (var k in $scope.sortings) {
                if ($scope.sortings[k].value === newVal) {
                    $scope.sorting = $scope.sortings[k];
                    break;
                }
            }
        }
    })
    $scope.$watch('s.d', function (newVal) {
        if (newVal !== $scope.sorting.direction) {
            $scope.sorting.direction = newVal;
        }
    })
    ngUrlBind($scope, 's');
    $scope.changeSortingDirection = function () {
        $scope.sorting.direction = -$scope.sorting.direction;
    }
    $scope.sort = function (sorting) {
        if ($scope.sorting.value !== sorting.value) {
            $scope.sorting = sorting;
        }
    }

    var diffNames = [
        {name: 'Duration', minified: 'du'},
        {name: 'BPM', minified: 'bpm'},
        {name: 'HPDrainRate', minified: 'hp'},
        {name: 'CircleSize', minified: 'cs'},
        {name: 'OverallDifficulty', minified: 'od'},
        {name: 'ApproachRate', minified: 'ar'},
        {name: 'DifficultyRating', minified: 'dr'},
        {name: 'Hit_length', minified: 'ht'},
        {name: 'PlayCount', minified: 'pc'},
        {name: 'PlaySuccess', minified: 'ps'},
        {name: 'FavouritedCount', minified: 'fc'},
        {name: 'NegativeUserRating', minified: 'nur'},
        {name: 'PositiveUserRating', minified: 'pur'},
        {name: 'Approved_date', minified: 'ad'},
        {name: 'Last_update', minified: 'lu'},
        {name: 'Submitted_date', minified: 'sd'}
    ]
    $scope.minmaxUnwatcher = {}
    $scope.mm = {};
    ngUrlBind($scope, 'mm');
    $scope.minmax_firstWatch = true;
    var functionBindWatchOnMinMax = function (diffName, propertyName, minifiedPropertyName) {
        $scope[propertyName] = null
        $scope.$watch(function () {
            return $scope[propertyName]
        }, function (newVal, oldVal) {
            if (oldVal !== newVal || $scope.minmax_firstWatch) {

                $scope.mm[minifiedPropertyName] = newVal;
                if ($scope.minmaxUnwatcher[minifiedPropertyName] === undefined) {
                    $scope.minmaxUnwatcher[minifiedPropertyName] = $scope.$watch(function () {
                        return $scope.mm[minifiedPropertyName]
                    }, function (newVal) {
                        if (newVal !== $scope[propertyName]) {
                            if (newVal === null) {
                                $scope[propertyName] = null;
                            }
                            else {
                                if (diffName === 'Approved_date' || diffName === 'Last_update' || diffName === 'Submitted_date') {
                                    $scope[propertyName] = new Date(newVal);
                                }
                                else {
                                    $scope[propertyName] = newVal;
                                }
                            }
                        }
                    })
                }
                $scope.draw();
            }
            if (propertyName === 'maxSubmitted_date') {
                $scope.minmax_firstWatch = false;
            }
        })
        if (diffName === 'Approved_date' || diffName === 'Last_update' || diffName === 'Submitted_date') {
            if ($scope.user[propertyName] != null || $scope.mm[minifiedPropertyName]) {
                $scope[propertyName] = $scope.mm[minifiedPropertyName] ? new Date($scope.mm[minifiedPropertyName]) : new Date($scope.user[propertyName])
            }
        }
        else {
            $scope[propertyName] = $scope.mm[minifiedPropertyName] ? $scope.mm[minifiedPropertyName] : $scope.user[propertyName];
        }
    }
    _.each(diffNames, function (dn) {
        var diffName = dn.name;
        var minProperty = 'min' + diffName;
        var minifiedMinProperty = dn.minified + 'm';
        var maxProperty = 'max' + diffName;
        var minifiedMaxProperty = dn.minified + 'x';
        functionBindWatchOnMinMax(diffName, minProperty, minifiedMinProperty);
        functionBindWatchOnMinMax(diffName, maxProperty, minifiedMaxProperty);
    })

    $scope.pageSizes = [20, 50, 100, 200];

    $scope.pageSize = $scope.user.pageSize;
    ngUrlBind($scope, 'pageSize');
    $scope.changePaging = function (pageSize) {
        if (pageSize != $scope.pageSize) {
            $scope.pageSize = pageSize;
        }
    }
    $scope.$watch('pageSize', function (newVal, oldVal) {
        if (newVal !== oldVal) {
            $scope.draw();
        }
    });

    $scope.disableStrict = $scope.user.disableStrict;
    ngUrlBind($scope, 'disableStrict');
    $scope.changeStrict = function () {
        $scope.disableStrict = !$scope.disableStrict;
        $scope.draw();
    }
    $scope.$watch('disableStrict', function (newVal, oldVal) {
        if (newVal !== oldVal) {
            $scope.draw();
        }
    });

    // PAGE INDEX management
    $scope.$watch('p', function (newVal, oldVal) {
        $scope.isNotFirstPage = $scope.p > 0;
        if (newVal !== oldVal) {
            $scope.draw();
        }
    })
    $scope.p = 0;

    ngUrlBind($scope, 'p');
    $scope.isNotFirstPage = false;
    $scope.hasNextPage = false;
    $scope.goNextPage = function () {
        $scope.p++;

    }
    $scope.goPreviousPage = function () {
        $scope.p--;
    }


    $scope.tags = _.map(tagTools.difficulties, function (d) {
        return tagTools.createTag(d, 'difficulty', d.name, d.classes);
    })
    ngUrlBind($scope, 'tags');
    $scope.addTagByUI = function (type, value) {
        var tag = {
            type: type,
            value: value
        }
        $scope.addTag(tag);
    }
    $scope.addTag = function (tag) {
        if (_.where($scope.tags, {type: tag.type, value: tag.value}).length === 0) {
            var newTag = tagTools.createTag(tag);
            $scope.selectedTag = null;
            $scope.tags.push(newTag);
            $scope.draw();
        }
    }
    $scope.removeTag = function (tagId) {
        $scope.tags = _.reject($scope.tags, function (tag) {
            return tag.tagId === tagId;
        });
        $scope.draw();
    }
    $scope.selectedTag = null


    $scope.currentPlayedZik = null;
    $scope.playBeatmap = function (beatmapId) {
        var zik = document.getElementById('player')
        if (beatmapId !== $scope.currentPlayedZik) {
            $scope.currentPlayedZik = beatmapId;
            zik.setAttribute('src', '/media/' + beatmapId + '/' + beatmapId + '.mp3');
            zik.play();
        }
        else {
            $scope.currentPlayedZik = null;
            zik.pause();
            zik.currentTime = 0;
        }
    };

    $scope.downloadAllLink = null;


    function showLoading() {
        $('.ao-loader').addClass('active');
    }

    function hideLoading() {
        $('.ao-loader').removeClass('active');
    }

    var draw_timeout = null;
    $scope.draw = function () {
        showLoading();
        window.clearTimeout(draw_timeout);
        draw_timeout = window.setTimeout(function () {
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
                    title: tagTools.getTagsByType($scope.tags, 'title'),
                    source: tagTools.getTagsByType($scope.tags, 'source'),
                    genre: tagTools.getTagsByType($scope.tags, 'genre'),
                    language: tagTools.getTagsByType($scope.tags, 'language'),
                    tags: tagTools.getTagsByType($scope.tags, 'tags')
                },
                sorting: {
                    name: $scope.sorting.value,
                    direction: $scope.sorting.direction
                },
                playedBeatmapValue: parseInt($scope.pbv, 10),
                disableStrict: $scope.disableStrict
            }
            _.each(diffNames, function (dn) {
                var diffName = dn.name;
                var minProperty = 'min' + diffName;
                var maxProperty = 'max' + diffName;
                filters[minProperty] = $scope[minProperty];
                filters[maxProperty] = $scope[maxProperty];

                //console.log(minProperty + ':' + $scope[minProperty])
                //console.log(maxProperty + ':' + $scope[maxProperty])
            })

            beatmapApi.get(function (errMessage) {

                },
                function (res) {
                    ga('send', 'pageview', '/');
                    _.each(res.packs, function (p) {
                        p.getPercentUserRating = function () {
                            return p.positiveUserRating * 100 / (p.positiveUserRating + p.negativeUserRating);
                        }
                        p.creator = $.isArray(p.creator) ? p.creator.join(', ') : p.creator;
                    })

                    $scope.packs = res.packs;
                    $scope.downloadAllLink = res.downloadAllLink;
                    $scope.hasNextPage = res.hasNextPage;
                    $scope.rssfeed = res.rssfeed;

                    hideLoading();
                },
                $scope.p,
                $scope.pageSize,
                filters,
                _.map(_.where($scope.extensions, {active: false}), function (e) {
                    return e.value;
                }));
        }, 50)
    }
    $scope.draw();


    $scope.foo = function () {
        console.log('foo');
    }

    $scope.listStyle = 2;
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
    $scope.changeDifficulty = function (dValue) {
        var arr = $scope.difficulties;
        var actives = _.where(arr, {active: true});
        var isInversed = actives.length === arr.length;
        if (isInversed) {
            _.each(arr, function (d) {
                if (d.value !== dValue) {
                    d.active = !d.active;
                }
            })
        }
        else {
            var currentDifficilty = _.where(arr, {value: dValue});
            _.each(currentDifficilty, function (d) {
                d.active = !d.active;
            });
        }
        $scope.draw();
    }
    $scope.changeMode = function (dValue) {
        var arr = $scope.modes;
        var actives = _.where(arr, {active: true});
        var isInversed = actives.length === arr.length;
        if (isInversed) {
            _.each(arr, function (d) {
                if (d.value !== dValue) {
                    d.active = !d.active;
                }
            })
        }
        else {
            var currentDifficilty = _.where(arr, {value: dValue});
            _.each(currentDifficilty, function (d) {
                d.active = !d.active;
            });
        }
    }
    $scope.changeApproved = function (dValue) {
        var currentApproved = _.where($scope.approved, {value: dValue});
        _.each(currentApproved, function (d) {
            d.active = !d.active;
        });
        var currentApprovedChecked = _.where($scope.approved, {active: true});
        if ((
                currentApprovedChecked.length === 2
                && (currentApprovedChecked[0].value === -1 && currentApprovedChecked[1].value === -2)
            )
            ||
            (currentApprovedChecked.length === 1
                && (currentApprovedChecked[0].value === -1 || currentApprovedChecked[0].value === -2)
            )
        ) {
            $scope.sort($scope.sortings.last_update);
        }
        $scope.draw();
    }
    $scope.bindCardsEvents = function () {
        $('.ao-beatmap-image-container').dimmer({
            on: 'hover'
        });
        $("img").error(function () {
            $(this).hide();
            // or $(this).css({visibility:"hidden"});
        });
        $('.beatmap-card').hover(function () {

            $('.beatmap-main-button', this).addClass('pink')
        }, function () {
            $('.beatmap-main-button', this).removeClass('pink')
        })
        $('.beatmap-tooltip').popup({
            inline: true,
            delay: {
                show: 500,
                hide: 0
            }
        });
    }

    $scope.saveExtrafilters = function () {
        $('.saving-loader').addClass('active');
        var toSave = {
            fileExtensionsToExclude: _.map(_.where($scope.extensions, {active: false}), function (e) {
                return e.value;
            }),
            modes: _.map(_.where($scope.modes, {active: true}), function (x) {
                return x.value
            }),
            difficulties: _.map(_.where($scope.difficulties, {active: true}), function (x) {
                return x.value
            }),
            playedBeatmaps: $scope.pbv,
            durationMin: $scope.minDuration,
            durationMax: $scope.maxDuration,
            disableStrict: $scope.disableStrict,
            pageSize: $scope.pageSize,
            sorting: $scope.sorting.value,
            sortingDirection: $scope.sorting.direction
        }
        _.each(diffNames, function (dn) {
            var diffName = dn.name;
            var minProperty = 'min' + diffName;
            var maxProperty = 'max' + diffName;
            toSave[minProperty] = $scope[minProperty];
            toSave[maxProperty] = $scope[maxProperty];
        })
        beatmapApi.saveProfile(toSave, function () {
            window.setTimeout(function () {
                $('.saving-loader').removeClass('active');
            }, 1000)
        }, function (message) {
            // todo: handle error message
        })
    }


    $('.sidenav-open, .toBottomPart').click(function () {
        $('.ui.sidebar.filters')
            .sidebar('toggle')
    });
    $('.beatmap-tooltip').popup()
    $scope.closeExtraFilters = function () {
        $('.ui.sidebar.filters')
            .sidebar('toggle')
    }

    // USER MANAGEMENT =================================================================

    // SIGNUP
    $scope.goToSignup = function () {
        $state.transitionTo('home.signup');
    }
    var resetForm = function () {
        $signupForm.form('clear')
    }
    $scope.openSignup = function () {
        resetForm();
        $('.signup.modal').modal('show');
    }
    var $signupForm = $('.form.signup');
    $signupForm.form({
        fields: {
            pseudo: {
                identifier: 'pseudo',
                rules: [{
                    type: 'empty',
                    prompt: 'Please enter your pseudo'
                }]
            },
            email: {
                identifier: 'mail',
                rules: [{
                    type: 'empty',
                    prompt: 'Please enter your e-mail'
                }, {
                    type: 'email',
                    prompt: 'Please provide a valid e-mail'
                }]
            },
            user_id: {
                identifier: 'user_id',
                rules: [{
                    type: 'integer',
                    prompt: 'Please enter an integer value'
                }]
            },
            password1: {
                identifier: 'password1',
                rules: [{
                    type: 'empty',
                    prompt: 'Please enter your password'
                }, {
                    type: 'minLength[5]',
                    prompt: 'Length of password must be at least 5 characters'
                }]
            },
            password2: {
                identifier: 'password2',
                rules: [{
                    type: 'empty',
                    prompt: 'Please confirm your password'
                }, {
                    type: 'match[password1]',
                    prompt: 'You must enter the same password'
                }]
            }
        },
        on: 'blur',
        inline: 'true'
    })

    $signupForm.on('submit', function () {
        if ($signupForm.form('is valid')) {
            $signupForm.find('.dimmer').addClass('active')
            var pseudo = $signupForm.find('#pseudo').val();
            var password1 = $signupForm.find('#password1').val();
            var mail = $signupForm.find('#mail').val();
            var user_id = $signupForm.find('#user_id').val();
            beatmapApi.createUser(pseudo, password1, mail, user_id, function () {
                window.setTimeout(function () {
                    $signupForm.find('.dimmer').removeClass('active')
                    $('.signup-result-ok').modal('show')
                }, 1000)
            }, function (message) {
                window.setTimeout(function () {
                    $signupForm.find('.dimmer').removeClass('active')
                    $('.signup-result-ko .signup-result-ko-reason').html(message)
                    $('.signup-result-ko').modal('show')
                }, 1000)
            });
        }
    })

    // SIGNIN
    $scope.logout = function () {
        authService.ClearCredentials(function () {
            window.location.href = '/'
        });
    }
    $scope.forgotYourPassword = function () {
        $('.forgot-password-modal').modal('show');
    }

    var $resetPwdForm = $('.forgot-password');
    $resetPwdForm.form({
        fields: {
            email: {
                identifier: 'forgot-password-email',
                rules: [{
                    type: 'empty',
                    prompt: 'Please enter your e-mail'
                }, {
                    type: 'email',
                    prompt: 'Please provide a valid e-mail'
                }]
            }
        },
        on: 'blur',
        inline: 'true'
    })

    $scope.sendResetMail = function () {
        if ($resetPwdForm.form('is valid')) {
            var mail = $('#forgot-password-email').val();
            beatmapApi.resetPassword(mail, function () {
                $('.mail-sent').modal('show');
            }, function (message) {
                $('.mail-sent-fail-reason').html(message);
                $('.mail-sent-fail').modal('show');
            })
        }
    }


    var $signingForm = $('.signin-form')
    $signingForm.form({})
    $scope.username = null;
    $scope.password = null;
    $signingForm.on('click', '.send-another-email', function () {
        beatmapApi.resendEmail($scope.username, function () {
            $('.mail-sent').modal('show');
        }, function (message) {
            $('.mail-sent-fail-reason').html(message);
            $('.mail-sent-fail').modal('show');
        });
    })
    $signingForm.on('submit', function () {
        if ($signingForm.form('is valid')) {
            authService.Login($scope.username, $scope.password, function (response) {
                var errors = [];
                if (response.userFound === false) {
                    errors.push('This user or email does not exist.');
                }
                else if (response.mailVerified === false) {
                    errors.push('That account has been created, but you have not yet clicked the verification link in your e-mail. <a class="send-another-email" >Send another email</a>');
                }
                else if (response.passwordOk === false) {
                    errors.push(' Password is wrong.');
                }
                if (errors.length > 0) {
                    $signingForm.form('add errors', errors);
                    $signingForm.removeClass('success').addClass('error');
                }
                else {
                    $scope.username = response.name;
                    authService.SetCredentials(response.name, $scope.password);
                    window.location.href = '/'
                }
            }, function (message) {
                var errors = [message];
                $signingForm.form('add errors', errors);
            });
        }
    })


    $scope.isLogged = $rootScope.globals && $rootScope.globals.currentUser;
    $('.ao-user').popup({
        on: 'click',
        popup: $scope.isLogged ? '.ao-user-options' : '.ao-user-login',
        position: 'bottom right',
        onShow: function () {
            $signingForm.removeClass('error')
        },
        onVisible: function () {
            $signingForm.find('.login-pseudo').focus();
        }
    });


    var $profileform = $('.user-options')
    $profileform.form({
        fields: {
            user_id: {
                identifier: 'options-osu_id',
                rules: [{
                    type: 'integer',
                    prompt: 'Please enter an integer value'
                }]
            }
        },
        on: 'blur',
        inline: 'true'
    });
    $profileform.on('submit', function () {
        if ($profileform.form('is valid')) {
            $profileform.find('.dimmer').addClass('active')
            beatmapApi.saveProfile({
                user_id: $scope.user.user_id
            }, function () {
                window.setTimeout(function () {
                    $profileform.find('.dimmer').removeClass('active')
                }, 1000)
            }, function (message) {
                // todo: handle error message
            })
        }
    });
    $scope.showProfileOptions = function () {
        $profileform.modal('show');
    }


    $scope.searchInput = "";
    $scope.results = null;
    var searchTimeout = null;
    var launchSearch = function () {
        console.log('launch search on ' + $scope.searchInput);
        beatmapApi.search(function (err) {
        }, function (res) {
            $scope.results = res;
        }, $scope.searchInput);
    }
    $scope.$watch('searchInput', function (newVal, oldVal) {
        if (newVal === undefined || newVal === null || newVal.trim() === '') {
            clearTimeout(searchTimeout);
            $scope.results = null;
        }
        else if (newVal !== oldVal) {
            clearTimeout(searchTimeout);
            searchTimeout = window.setTimeout(function () {
                launchSearch();
            }, 300);
        }
    });

    $scope.playedVideoBeatmapId = null;
    $scope.playerYT = null;
    $scope.disableYT = false;
    $scope.$watch('searchInput', function (newVal, oldVal) {
        if (newVal == false) {
            startYoutubeLeavingTimeout();
        }
    });

    var enterVideoPlayerOrIconTimeout;
    var loadNewVideoTimeout;

    function startYoutubeLeavingTimeout() {
        $('#popover_youtube_content').hide();
        if ($scope.playerYT) {
            $scope.playerYT.stopVideo();
        }
        $scope.playedVideoBeatmapId = null;
    }

    var $playerContainer = $('#popover_youtube_content');
    var $playerContainerTitle = $playerContainer.find('.title');

    function youtube_toggleDimmer(activateIt) {
        if (activateIt === true) {
            $playerContainer.find('.dimmer').addClass('active');
        }
        else {
            $playerContainer.find('.dimmer').removeClass('active');
        }
    }

    $scope.searchYoutTube = function (beatmap, evt, isLeaving) {
        if ($scope.disableYT === false) {
            if (beatmap == null) {  // video container events
                if (isLeaving === true) {
                    console.log('container -- is leaving');
                    enterVideoPlayerOrIconTimeout = window.setTimeout(startYoutubeLeavingTimeout, 200);
                }
                else {
                    console.log('container -- is entering');
                    window.clearTimeout(loadNewVideoTimeout);
                    var playerContainerBeatmapId = $playerContainer.attr('beatmap_id');
                    console.log(playerContainerBeatmapId + ' (player) vs ' + $scope.playedVideoBeatmapId + ' (scope)')
                    if ($playerContainer.attr('beatmap_id') == $scope.playedVideoBeatmapId) {
                        console.log('container -- same beatmap id -- keep playing');
                        window.clearTimeout(enterVideoPlayerOrIconTimeout);
                    }
                    else {
                        console.log('container -- not the same beatmap id -- STOP playing');
                    }
                }
            }
            else {
                var beatmapId = beatmap.beatmap_id;
                var $icon = $(evt.target);

                if (isLeaving === true) {
                    console.log('icon -- is leaving');
                    enterVideoPlayerOrIconTimeout = window.setTimeout(startYoutubeLeavingTimeout, 200);
                }
                else {
                    console.log('icon -- is entering');
                    window.clearTimeout(enterVideoPlayerOrIconTimeout);

                    if (beatmapId == $scope.playedVideoBeatmapId) { // already playing beatmap
                        // Do nothing
                    }
                    else {
                        function loadNewVideo() {
                            youtube_toggleDimmer(true);
                            $playerContainerTitle.html(beatmap.title + ' - ' + beatmap.artist + ' [' + beatmap.version + ']')
                            $scope.playedVideoBeatmapId = beatmapId;
                            $playerContainer.show().position({
                                of: $icon,
                                my: "center bottom",
                                at: "center top",
                                collision: "flipfit flip",
                                using: function (offset, feedback) {
                                    var left = offset.left;
                                    var top = offset.top;
                                    if (feedback.vertical == 'bottom') {
                                        top = top - 35;
                                    }
                                    else {
                                        top = top + 10;
                                    }
                                    $(this).css('top', top).css('left', left);
                                }
                            }).attr('beatmap_id', beatmapId);


                            beatmapApi.searchYouTube(function (err) {
                                console.log(err);
                            }, function (ytResponse) {
                                var playerYT_Id = 'youtube_player'

                                var videoID = null;
                                if (ytResponse.items && ytResponse.items.length == 1) {
                                    videoID = ytResponse.items[0].id.videoId;
                                }

                                if ($scope.playerYT) {
                                    $scope.playerYT.loadVideoById(videoID);
                                    var state = $scope.playerYT.getPlayerState();
                                    if (state != 1) {
                                        $scope.playerYT.playVideo();
                                        youtube_toggleDimmer(false);
                                    }
                                }
                                else {
                                    $scope.playerYT = new YT.Player(playerYT_Id, {
                                        height: '390',
                                        width: '640',
                                        videoId: videoID,
                                        events: {
                                            'onReady': function (event) {
                                                event.target.playVideo();
                                                youtube_toggleDimmer(false);
                                            }
                                        }
                                    });
                                }

                            }, beatmapId);
                        }

                        if ($scope.playedVideoBeatmapId == null) {
                            loadNewVideo();
                        }
                        else { // player is playing something just not the current beatmap
                            // it's maybe a cross over to get to the player
                            loadNewVideoTimeout = window.setTimeout(loadNewVideo, 200);
                        }


                    }
                }
            }
        }
    }
}]);

