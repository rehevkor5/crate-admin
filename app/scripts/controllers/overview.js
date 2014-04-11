'use strict';

angular.module('overview', ['stats', 'sql', 'common', 'tableinfo'])
  .controller('OverviewController', function ($scope, $location, $log, $timeout, ClusterState, SQLQuery, TableInfo) {

    var colorMap = {
      "good": 'panel-success',
      "warning": 'panel-warning',
      "critical": 'panel-danger',
      '--': 'panel-default'
    };

    $scope.available_data = '--';
    $scope.records_unavailable = '--';
    $scope.replicated_data = '--';
    $scope.records_total = '--';
    $scope.records_underreplicated = '--';
    $scope.cluster_state = '--';
    $scope.cluster_color_class = 'panel-default';

    $scope.$watch(function() { return ClusterState.data; }, function (data) {
      $scope.cluster_state = data.status;
      $scope.cluster_color_class = colorMap[data.status];

      if (!data.tableInfo || !data.tableInfo.tables.length) {
        $scope.available_data = 100;
        $scope.records_unavailable = 0;
        $scope.replicated_data = 100;
        $scope.records_total = 0;
        $scope.records_underreplicated = 0;
        return;
      };

      var tables = [];
      for (var i=0; i<data.tableInfo.tables.length; i++) {
        var table = data.tableInfo.tables[i];
        var tableInfo = new TableInfo(data.shardInfo.filter(function(shard, idx) { return table.name === shard.name; }));
        tableInfo.shards_configured = table.number_of_shards;
        tables.push(tableInfo);
      }
      $scope.records_underreplicated = tables.reduce(function(memo, tableInfo, idx) {
        return tableInfo.underreplicatedRecords() + memo;
      }, 0);
      $scope.records_unavailable = tables.reduce(function(memo, tableInfo, idx) {
        return tableInfo.unavailableRecords() + memo;
      }, 0);
      $scope.records_total = tables.reduce(function(memo, tableInfo, idx) {
        return tableInfo.totalRecords() + memo;
      }, 0);

      if ($scope.records_total) {
        $scope.replicated_data = ($scope.records_total-$scope.records_underreplicated) / $scope.records_total * 100.0;
        $scope.available_data = ($scope.records_total-$scope.records_unavailable) / $scope.records_total * 100.0;
      } else {
        $scope.replicated_data = 100.0;
        $scope.available_data = 100.0;
      }

      $scope.history = {
	data: [
	  [0.3, 1.1, 1.2, 1.3, 1.4, 1.5, 1.2, 1.3, 1.4, 1.3, 1.2, 1.1, 0.8, 0.6],
	  [1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 2.2, 2.3, 2.4, 2.3, 2.2, 2.1, 1.8, 1.6],
	  [2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.2, 3.3, 3.4, 3.3, 3.2, 3.1, 2.8, 2.6]
	],
	width: 600,
	height: 300
      };

    }, true);

    // bind tooltips
    $("[rel=tooltip]").tooltip({ placement: 'top'});

  });
