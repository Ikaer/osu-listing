'use strict';

angular.module('ng-if-bootstrap-grid', [])
    .directive('ngIfBootstrapGrid', ['ngIfDirective', '$window', function(ngIfDirective, $window) {
        var ngIf = ngIfDirective[0];

        return {
            transclude: ngIf.transclude,
            priority: ngIf.priority,
            terminal: ngIf.terminal,
            restrict: ngIf.restrict,
            link: function($scope, $element, $attr) {

                    angular.element($window).bind('resize', function() {
                        $scope.$apply();
                    });

					function isDisplayed(query) {
						var elem = document.querySelector(query);
						var elementStyleMap = $window.getComputedStyle(elem, null);
						return elementStyleMap.display !== 'none';
					}

					// This should be in compile() function, but that breaks the code.
					var tester = document.getElementsByClassName("ng-if-bootstrap-grid-detection-block");
					if (tester.length === 0) {
						var e = angular.element(document).find('body');
						e.append(
							'<!-- ng-if-bootstrap-grid-detection-block: -->\
							<div class="ng-if-bootstrap-grid-detection-block">\
								<div class="device-xs visible-xs visible-xs-block"></div>\
								<div class="device-sm visible-sm visible-sm-block"></div>\
								<div class="device-md visible-md visible-md-block"></div>\
								<div class="device-lg visible-lg visible-lg-block"></div>\
							</div>');
					}

                    $attr.ngIf = function() {
                        var render = false;
                        var splitArr = $attr.ngIfBootstrapGrid.split(/[, ]+/g); // allows runtime changes

                        for (var i = 0; i < splitArr.length; i++) {
                            switch (splitArr[i].toLowerCase()) {
                                case 'xs':
									render = isDisplayed('.ng-if-bootstrap-grid-detection-block .visible-xs');
                                    break;
                                case 'sm':
									render = isDisplayed('.ng-if-bootstrap-grid-detection-block .visible-sm');
									break;
                                case 'md':
									render = isDisplayed('.ng-if-bootstrap-grid-detection-block .visible-md');
                                    break;
                                case 'lg':
                                    render = isDisplayed('.ng-if-bootstrap-grid-detection-block .visible-lg');
                                    break;
                                default:
                                    throw 'Unknown bootstrap grid class: ' + splitArr[i];
                            }
                            if (render === true) {
                                break;
                            }
                        }
                        return render;
                    };
                    ngIf.link.apply(ngIf, arguments);
                }

        };
    }])
    .directive('ngIfNotBootstrapGrid', ['ngIfDirective', '$window', function(ngIfDirective, $window) {
        var ngIf = ngIfDirective[0];

        return {
            transclude: ngIf.transclude,
            priority: ngIf.priority,
            terminal: ngIf.terminal,
            restrict: ngIf.restrict,
            link: function($scope, $element, $attr) {

                angular.element($window).bind('resize', function() {
                    $scope.$apply();
                });

				function isDisplayed(query) {
					var elem = document.querySelector(query);
					var elementStyleMap = $window.getComputedStyle(elem, null);
					return elementStyleMap.display !== 'none';
				}

				// This should be in compile() function, but that breaks the code.
				var tester = document.getElementsByClassName("ng-if-bootstrap-grid-detection-block");
		        if (tester.length === 0) {
					var e = angular.element(document).find('body');
					e.append(
		                '<!-- ng-if-bootstrap-grid-detection-block: -->\
						<div class="ng-if-bootstrap-grid-detection-block">\
							<div class="device-xs visible-xs visible-xs-block"></div>\
							<div class="device-sm visible-sm visible-sm-block"></div>\
							<div class="device-md visible-md visible-md-block"></div>\
							<div class="device-lg visible-lg visible-lg-block"></div>\
						</div>');
		        }

                $attr.ngIf = function() {
                    var render = false;
                    var splitArr = $attr.ngIfNotBootstrapGrid.split(/[, ]+/g); // allows runtime changes

                    for (var i = 0; i < splitArr.length; i++) {
                        switch (splitArr[i].toLowerCase()) {
							case 'xs':
								render = !isDisplayed('.ng-if-bootstrap-grid-detection-block .visible-xs');
								break;
							case 'sm':
								render = !isDisplayed('.ng-if-bootstrap-grid-detection-block .visible-sm');
								break;
							case 'md':
								render = !isDisplayed('.ng-if-bootstrap-grid-detection-block .visible-md');
								break;
							case 'lg':
								render = !isDisplayed('.ng-if-bootstrap-grid-detection-block .visible-lg');
								break;
							default:
								throw 'Unknown bootstrap grid class: ' + splitArr[i];
                        }
                        if (render === true) {
                            break;
                        }
                    }
                    return render;
                };
                ngIf.link.apply(ngIf, arguments);
            }
        };
    }]);
