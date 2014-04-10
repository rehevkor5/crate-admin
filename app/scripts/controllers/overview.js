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

      drawGraph(data.loadHistory);
    }, true);

    var drawGraph = function drawGraph(history) {
      var data = [];
      for (var j=0; j<history.length; j++) {
        var lh = history[j], d = [];
        for (var i=0; i<lh.length; i++) d.push([i, lh[i]]);
        data.push(d);
      }

	var w = 400,
	    h = 200,
	    margin = 20,
	    y = d3.scale.linear().domain([0, d3.max(data)]).range([0 + margin, h - margin]),
	    x = d3.scale.linear().domain([0, data.length]).range([0 + margin, w - margin]);

	var vis = d3.select("body")
		.append("svg:svg")
		.attr("width", w)
		.attr("height", h);

	var g = vis.append("svg:g")
		.attr("transform", "translate(0, 200)");

	var line = d3.svg.line()
		.x(function(d,i) { return x(i); })
		.y(function(d) { return -1 * y(d); });
    };

    // bind tooltips
    $("[rel=tooltip]").tooltip({ placement: 'top'});

  });
