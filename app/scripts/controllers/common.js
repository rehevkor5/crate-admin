'use strict';

angular.module('common', ['stats'])
  .controller('StatusBarController', function ($scope, $log, $location, $sce, ClusterState) {
    var colorMap = {"good": '',
                    "warning": 'label-warning',
                    "critical": 'label-danger',
                    '--': 'label-danger'};
    var docsBaseURL = 'https://crate.io/docs';
    $scope.cluster_color_label = 'label-default';
    $scope.$watch( function () { return ClusterState.data; }, function (data) {
      var hashes = [];
      var versions = data.cluster.filter(function(obj, idx){
        var hash = obj.version.build_hash;
        var contains = hashes.indexOf(hash) == -1;
        hashes.push(hash);
        return contains;
      }).map(function(obj, idx){
        return obj.version.number;
      });
      $scope.versions = versions;
      $scope.version_warning = versions.length > 1;
      $scope.cluster_state = data.status;
      $scope.cluster_name = data.name;
      $scope.num_nodes = data.cluster.length;
      $scope.cluster_color_label = colorMap[data.status];
      $scope.load1 = data.load[0]  == '-.-' ? data.load[0] : data.load[0].toFixed(2);
      $scope.load5 = data.load[1]  == '-.-' ? data.load[1] : data.load[1].toFixed(2);
      $scope.load15 = data.load[2] == '-.-' ? data.load[2] : data.load[2].toFixed(2);
      $scope.version = data.version;
      $scope.docs_url = $sce.trustAsResourceUrl(docsBaseURL + (data.version ? '/en/'+data.version.number : '/stable') + '/');
    }, true);
    // bind tooltips
    $("[rel=tooltip]").tooltip({ placement: 'bottom'});
  })
  .controller('NavigationController', function ($scope, $location) {
    $scope.isActive = function (viewLocation) {
      if (viewLocation == '/') {
        return viewLocation === $location.path();
      } else {
        return $location.path().substr(0, viewLocation.length) == viewLocation;
      }
    };
  })
  .directive('fixBottom', function(){
    return function(scope, element, attr){
      var elem = $(element),
          nav = $('.side-nav .navbar-nav'),
          win = $(window);
      var calculate = function calculate(){
        scope.fixBottom = (nav.offset().top + nav.height() + elem.height() < win.height());
      };
      win.on("resize", calculate);
      calculate();
    };
  });
