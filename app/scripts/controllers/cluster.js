'use strict';

angular.module('cluster', ['stats', 'sql', 'common'])
    .controller('ClusterController', function ($scope, $interval, ClusterState) {

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


	$scope.$watch(function () { return ClusterState.data; }, function (data) {
	    var cluster = ClusterState.data.cluster;
	    $scope.renderSidebar = cluster.length;
	});

	// sidebar button handler (mobile view)
	$scope.toggleSidebar = function() {
	    $("#wrapper").toggleClass("active");
	};

	// bind tooltips
	$("[rel=tooltip]").tooltip({ placement: 'top'});

  });
