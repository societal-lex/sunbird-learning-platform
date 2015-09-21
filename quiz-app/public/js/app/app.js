// Ionic Quiz App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'quiz' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
function backbuttonPressed() {
    if(!Renderer.running) {
        TelemetryService.end("org.ekstep.quiz.app", "1.0");
    }
}
angular.module('quiz', ['ionic', 'ngCordova', 'quiz.services'])
    .run(function($ionicPlatform, $cordovaFile, $cordovaToast, ContentService) {
        $ionicPlatform.ready(function() {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            console.log('ionic platform is ready...');
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }
            if (window.StatusBar) {
                StatusBar.styleDefault();
            }

            $ionicPlatform.onHardwareBackButton(function() {
                backbuttonPressed();
            });
            $ionicPlatform.on("pause", function() {
                Renderer.pause();
            });
            $ionicPlatform.on("resume", function() {
                Renderer.resume();
            });
            $ionicPlatform.on("backbutton", function() {
                backbuttonPressed();
            });
        });
    })
    .config(function($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise("/content/list");
        $stateProvider
            .state('contentList', {
                url: "/content/list",
                templateUrl: "templates/content-list.html",
                controller: 'ContentListCtrl'
            })
            .state('playContent', {
                url: "/play/content/:item",
                templateUrl: "templates/renderer.html",
                controller: 'ContentCtrl'
            });
    })
    .controller('ContentListCtrl', function($scope, $rootScope, $http, $cordovaFile, $cordovaToast, $ionicPopover, $state, $q, ContentService) {

        var currentContentVersion = "0.2";

        new Promise(function(resolve, reject) {
                if(currentContentVersion != ContentService.getContentVersion()) {
                    console.log("Clearing ContentService cache.");
                    ContentService.clear();
                    ContentService.setContentVersion(currentContentVersion);
                }
                ContentService.init();
                resolve(TelemetryService._gameData);
            })
            .then(function(game) {
                if (!game) {
                    return GlobalContext.init("org.ekstep.quiz.app", currentContentVersion);
                } else {
                    return true;
                }
            })
            .then(function() {
                TelemetryService.start();
                return true;
            })
            .then(function() {
                $scope.loadBookshelf();
                $scope.checkContentCount();
            })
            .catch(function(error) {
                TelemetryService.exitWithError(error);
            });

        // $ionicPopover.fromTemplateUrl('templates/main-menu.html', {
        //     scope: $scope
        // }).then(function(popover) {
        //     $scope.mainmenu = popover;
        // });

        // $scope.openMainMenu = function($event) {
        //     $scope.mainmenu.show($event);
        // };
        // $scope.closeMainMenu = function() {
        //     $scope.mainmenu.hide();
        // };

        $scope.showMessage = false;
        $scope.$on('show-message', function(event, data) {
            if (data.message && data.message != '') {
                $scope.$apply(function() {
                    $scope.showMessage = true;
                    $scope.message = data.message;
                });
            }
            if(data.timeout) {
                setTimeout(function() {
                    $scope.$apply(function() {
                        $scope.showMessage = false;
                    });
                    console.log('callback');
                    if (data.callback) {
                        data.callback();
                    }
                }, data.timeout);
            }
            if(data.reload) {
                $scope.$apply(function() {
                    $scope.loadBookshelf();
                });
            }
        });

        $scope.resetContentListCache = function() {
            $("#loadingDiv").show();
            setTimeout(function() {
                $scope.$apply(function() {
                    $scope.showMessage = false;
                });
                ContentService.sync()
                    .then(function() {
                        var processing = ContentService.getProcessCount();
                        if(processing > 0) {
                            $rootScope.$broadcast('show-message', {
                                "message": AppMessages.DOWNLOADING_MSG.replace('{0}', processing)
                            });
                        } else {
                            $rootScope.$broadcast('show-message', {
                                "message": AppMessages.NO_NEW_CONTENT,
                                "timeout": 3000,
                                "callback": $scope.checkContentCount
                            });
                        }
                        $scope.loadBookshelf();
                        console.log('flushing telemetry in 2sec...');
                        setTimeout(function() {
                            TelemetryService.flush();
                        }, 2000);
                    });
            }, 100);
        }

        $scope.loadBookshelf = function() {
            $scope.worksheets = ContentService.getContentList('worksheet');
            console.log("$scope.worksheets:", $scope.worksheets);
            $scope.stories = ContentService.getContentList('story');
            console.log("$scope.stories:", $scope.stories);
            initBookshelf();
        };

        $scope.checkContentCount = function() {
            var count = ContentService.getContentCount();
            if(count <= 0) {
                $rootScope.$broadcast('show-message', {
                    "message": AppMessages.NO_CONTENT_FOUND
                });
            }
        };

        $scope.playContent = function(content) {
            $state.go('playContent', {
                'item': JSON.stringify(content)
            });
        };

    }).controller('ContentCtrl', function($scope, $http, $cordovaFile, $cordovaToast, $ionicPopover, $state, ContentService, $stateParams) {
        if ($stateParams.item) {
            $scope.item = JSON.parse($stateParams.item);
            Renderer.start($scope.item.baseDir, 'gameCanvas', $scope.item.identifier);
        } else {
            alert('Name or Launch URL not found.');
            $state.go('contentList');
        }
        $scope.$on('$destroy', function() {
            setTimeout(function() {
                Renderer.cleanUp();
            }, 100);
        });
    });


function initBookshelf() {
    setTimeout(function() {
        $(".product_title").remove();
        $(".fx_shadow").remove();
        var widthToHeight = 16 / 9;
        var newWidth = window.innerWidth;
        var newHeight = window.innerHeight;
        var newWidthToHeight = newWidth / newHeight;
        if (newWidthToHeight > widthToHeight) {
            newWidth = newHeight * widthToHeight;
        } else {
            newHeight = newWidth / widthToHeight;
        }
        $.bookshelfSlider('#bookshelf_slider', {
            'item_width': newWidth,
            'item_height': newHeight,
            'products_box_margin_left': 30,
            'product_title_textcolor': '#ffffff',
            'product_title_bgcolor': '#990000',
            'product_margin': 30,
            'product_show_title': true,
            'show_icons': true,
            'buttons_margin': 15,
            'buttons_align': 'center', // left, center, right
            'slide_duration': 800,
            'slide_easing': 'easeOutCirc',
            'arrow_duration': 800,
            'arrow_easing': 'easeInCirc',
            'folder': ''
        });
        $(".panel_slider").height($(".view-container").height() - $(".panel_title").height() - $(".panel_bar").height());
        console.log('Loading completed....');
        $("#loadingDiv").hide();
    }, 100);
}