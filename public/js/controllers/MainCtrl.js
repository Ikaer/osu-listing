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

angular.module('MainCtrl', ['BeatmapAPI', 'Authentication']).controller('MainController', ['$rootScope', '$scope', '$location', '$state', 'beatmapApi', 'AuthenticationService', 'userLoader', function ($rootScope, $scope, $location, $state, beatmapApi, authService, userLoader) {


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
    _.each($scope.extensions, function (m) {
        m.init = m.active;
    })
    $scope.playedBeatmaps = [
        {value: 0, name: 'all of them'},
        {value: 1, name: 'only the ones I\'ve never played any difficulty in it'},
        {value: 2, name: 'only the ones I\'ve at least one difficulty in it'}
    ]
    $scope.playedBeatmapValue = $scope.user.playedBeatmaps;
    $scope.modes = [
        {value: 0, name: 'Osu!', active: findValueInUserProfile('modes', 0), init: false},
        {value: 1, name: 'Taiko', active: findValueInUserProfile('modes', 1), init: false},
        {value: 2, name: 'Catch the beat', active: findValueInUserProfile('modes', 2), init: false},
        {value: 3, name: 'Osu!Mania', active: findValueInUserProfile('modes', 3), init: false}
    ]
    _.each($scope.modes, function (m) {
        m.init = m.active;
    })
    $scope.difficulties = [
        {value: 1, name: 'Easy', active: findValueInUserProfile('difficulties', 1), init: false},
        {value: 2, name: 'Normal', active: findValueInUserProfile('difficulties', 2), init: false},
        {value: 3, name: 'Hard', active: findValueInUserProfile('difficulties', 3), init: false},
        {value: 4, name: 'Insane', active: findValueInUserProfile('difficulties', 4), init: false},
        {value: 5, name: 'Expert', active: findValueInUserProfile('difficulties', 5), init: false}
    ];
    _.each($scope.difficulties, function (d) {
        d.init = d.active;
    })
    $scope.approved = [
        {value: 0, name: 'Pending', active: false},
        {value: 1, name: 'Ranked', active: true},
        {value: 2, name: 'Approved', active: true},
        {value: 3, name: 'Qualified', active: false},
        {value: -1, name: 'WIP', active: false},
        {value: -2, name: 'Graveyard', active: false}
    ];
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
    $scope.minDuration = $scope.user.durationMin;
    $scope.maxDuration = $scope.user.durationMax;
    var diffNames = [
        'HPDrainRate',
        'CircleSize',
        'OverallDifficulty',
        'ApproachRate'
    ]
    _.each(diffNames, function(diffName){
        var minProperty = 'min' + diffName;
        var maxProperty = 'max' + diffName;
        $scope[minProperty] = $scope.user[minProperty];
        $scope[maxProperty] = $scope.user[maxProperty];
    })

    $scope.pageSize = 20;
    $scope.pageIndex = 0;
    $scope.isNotFirstPage = false;
    $scope.hasNextPage = false;
    $scope.goNextPage = function () {
        $scope.pageIndex++;
        $scope.isNotFirstPage = true;
        $scope.draw();
    }
    $scope.goPreviousPage = function () {
        $scope.pageIndex--;
        if ($scope.pageIndex === 0) {
            $scope.isNotFirstPage = false;
        }
        $scope.draw();
    }
    $scope.tags = _.map(tagTools.difficulties, function (d) {
        return tagTools.createTag(d, 'difficulty', d.name, d.classes);
    })


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
    $scope.playBeatmap = function (beatmapId) {
        var zik = document.getElementById('player')
        zik.setAttribute('src', '/media/' + beatmapId + '/' + beatmapId + '.mp3');
        zik.play();
    };
    $scope.downloadAllLink = null;


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
            minDuration: $scope.minDuration,
            maxDuration: $scope.maxDuration,
            playedBeatmapValue: parseInt($scope.playedBeatmapValue, 10)
        }
        _.each(diffNames, function(diffName){
            var minProperty = 'min' + diffName;
            var maxProperty = 'max' + diffName;
            filters[minProperty] = $scope[minProperty];
            filters[maxProperty] = $scope[maxProperty];
        })
        beatmapApi.get(function (errMessage) {

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
                $scope.hasNextPage = res.hasNextPage;
                hideLoading();
            },
            $scope.pageIndex,
            $scope.pageSize,
            filters,
            _.map(_.where($scope.extensions, {active: false}), function (e) {
                return e.value;
            }));

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
        $scope.draw();
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
    //playedBeatmaps:{type:Number, default:0},
    //fileExtensionsToExclude:{type: [String], default:[]},
    //durationMin:{type:Number, default:null},
    //durationMax:{type:Number, default:null

    $scope.saveDurationAndDiffs = function () {
        var $button = $('#save-durationAndDiffs');
        $button.addClass('loading');
        var toSave = {
            durationMin: $scope.minDuration,
            durationMax: $scope.maxDuration
        }
        _.each(diffNames,function(diffName){
            var minProperty = 'min' + diffName;
            var maxProperty = 'max' + diffName;
            toSave[minProperty] = $scope[minProperty];
            toSave[maxProperty] = $scope[maxProperty];
        })
        beatmapApi.saveProfile(toSave, function () {
            window.setTimeout(function () {
                $button.removeClass('loading');
            }, 1000)
        }, function (message) {
            // todo: handle error message
        })
    }




    $scope.savePlayedBeatmaps = function () {
        var $button = $('#save-played-beatmaps');
        $button.addClass('loading');
        beatmapApi.saveProfile({
            playedBeatmaps: $scope.playedBeatmapValue
        }, function () {
            window.setTimeout(function () {
                $button.removeClass('loading');
            }, 1000)
        }, function (message) {
            // todo: handle error message
        })
    }
    $scope.saveExtensions = function () {
        var $button = $('#save-extensions');
        $button.addClass('loading');
        beatmapApi.saveProfile({
            fileExtensionsToExclude: _.map(_.where($scope.extensions, {active: false}), function (e) {
                return e.value;
            })
        }, function () {
            window.setTimeout(function () {
                $button.removeClass('loading');
            }, 1000)
        }, function (message) {
            // todo: handle error message
        })
    }

    $('.ui.search').search({
        apiSettings: {
            url: '/api/tagsSemantic/{query}'
        },
        type: 'category',
        onSelect: function (result, response) {
            $scope.pageIndex = 0;
            $scope.addTag(result.o);
        },
        delay: 100
    });
    $('.sidenav-open').click(function () {
        $('.ui.sidebar.filters')
            .sidebar('toggle')
    })
    $('.sidenav-search-open').click(function () {
        $('.ui.sidebar.side-search')
            .sidebar('toggle')
    })
    $('.beatmap-tooltip').popup()


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
                modes: _.map(_.where($scope.modes, {init: true}), function (x) {
                    return x.value
                }),
                difficulties: _.map(_.where($scope.difficulties, {init: true}), function (x) {
                    return x.value
                }),
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
}]);

