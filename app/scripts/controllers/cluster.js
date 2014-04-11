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

	$scope.$watch(function () {
	    return ClusterState.data;
	}, function (data) {
	    var cluster = data.cluster;
	    $scope.renderSidebar = cluster.length > 0;
	    $scope.cluster = angular.toJson(cluster, true);
        if (!cluster.length) return;
        var sorted_cluster = cluster.sort(function(a, b){
		    if (a.name > b.name) return -1;
		    if (a.name < b.name) return 1;
		    return 0;
	    });

 	    var memData = [];
	    var fsData = [];
	    for (var i=0; i<sorted_cluster.length; i++){
	    	var item = sorted_cluster[i];
	    	memData.push({
	    	    "_id": i+1,
	    	    "label": item.name,
	    	    "used": item.mem.used,
	    	    "total": item.mem.total,
		    "url": "#/nodes/"+item.name
	    	});
	    	fsData.push({
	    	    "_id": i+1,
	    	    "label": item.name,
	    	    "used": item.fs.used,
	    	    "total": item.fs.total,
		    "url": "#/nodes/"+item.name
	    	});
	    }

        $scope.fsDiagram = {
            data: fsData,
            causes: ['used', 'total'],
            labels: fsData.filter(function(obj){ return obj.label; }),
            size: 200
        };
        $scope.memDiagram = {
            data: memData,
            causes: ['used', 'total'],
            labels: memData.filter(function(obj){ return obj.label; }),
            size: 200
        };
	}, true);

	// sidebar button handler (mobile view)
	$scope.toggleSidebar = function() {
	    $("#wrapper").toggleClass("active");
	};

	// bind tooltips
	$("[rel=tooltip]").tooltip({ placement: 'top'});

  });
