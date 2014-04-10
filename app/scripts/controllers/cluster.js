'use strict';

angular.module('cluster', ['stats'])
    .controller('ClusterController', function ($scope, ClusterState) {

	var empty_node = {
	    'name': 'Cluster (0 Nodes)',
	    'id': '',
	    'summary': [],
	    'health': '--',
	    'health_label_class': '',
	    'health_panel_class': '',
	    'hostname': '',
	    'address': '',
	    'heap': {
		'total': 0,
		'used': 0,
		'used_percent': 0
	    },
	    'fs': {
		'free': 0,
		'used': 0,
		'free_percent': 0,
		'used_percent': 0
	    }
	};

	var updateGraph = function updateGraph(_data) {
	    var memData = [];
	    var fsData = [];
	    for (var i=0; i<_data.length; i++){
	    	var item = _data[i];
	    	memData.push({
	    	    "_id": i+1,
	    	    "label": item.name,
	    	    "used": item.mem.used,
	    	    "total": item.mem.total
	    	});
	    	fsData.push({
	    	    "_id": i+1,
	    	    "label": item.name,
	    	    "used": item.fs.used,
	    	    "total": item.fs.total
	    	});
	    }
	    var drawGraph = function drawGraph(data, target){
		$(target).empty();
		var rose = Chart.rose(),
		    height = 300,
		    causes = ['used', 'total'],
		    labels = data.filter(function(obj){ return obj.label; });

		// Get the maximum value:
		var maxVal = d3.max( data, function(d) {
		    return d.used+d.total;
		});

		// Where the maximum value gives us the maximum radius:
		var maxRadius = Math.sqrt(maxVal*data.length / Math.PI);


		// Append a new figure to the DOM:
		var figure = d3.select(target)
			.append( 'figure' );

		// Get the figure width:
		var width = parseInt( figure.style( 'width' ), 10 );

		// Update the chart generator settings:
		rose.legend( causes )
		    .width( width )
		    .height( height )
		    .delay( 0 )
		    .duration( 0 )
		    .domain( [0, maxRadius] )
		    .angle( function(d) { return d._id; } )
		    .area( function(d, i) { return [d.used, d.total]; } );

		// Bind the data and generate a new chart:
		figure.datum( data )
		    .attr('class', 'chart figure1')
		    .call( rose );

	    };

	    drawGraph(memData, "#graph-mem");
	    drawGraph(fsData, "#graph-fs");
	};

	$scope.$watch(function () {
	    return ClusterState.data;
	}, function (data) {
	    var cluster = data.cluster;
	    $scope.renderSidebar = cluster.length > 0;
	    $scope.cluster = angular.toJson(cluster, true);
	    updateGraph(cluster.sort(function(a, b){
		if (a.name > b.name) return -1;
		if (a.name < b.name) return 1;
		return 0;
	    }));
	}, true);

	// sidebar button handler (mobile view)
	$scope.toggleSidebar = function() {
	    $("#wrapper").toggleClass("active");
	};

	// bind tooltips
	$("[rel=tooltip]").tooltip({ placement: 'top'});

  });
