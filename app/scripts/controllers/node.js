'use strict';

angular.module('node', ['stats'])
    .controller('NodeController', function ($scope, $log, $routeParams, $interval, ClusterState) {

	var selected = $routeParams.node_name;

	var intervalId;
	var refreshInterval = 5000;

	$scope.percentageLimitYellow = 90;
	$scope.percentageLimitRed = 98;

	var colorMapPanel = {
	    "good": 'panel-success',
	    "warning": 'panel-warning',
	    "critical": 'panel-danger',
	    '--': 'panel-default'
	};

	var colorMapLabel = {
	    "good": '',
	    "warning": 'label-warning',
	    "critical": 'label-danger',
	    '--': ''
	};

	var healthPriorityMap = {
	    "good": 2, "warning": 1, "critical": 0, "--": 0
	};

	var Health = function Health(node) {
	    this.getStatus = function getStatus(val){
		if (val > $scope.percentageLimitRed) {
		    return 'critical';
		} else if (val > $scope.percentageLimitYellow) {
		    return 'warning';
		}
		return 'good';
	    };
	    this.value = Math.max(node.fs.used_percent, node.mem.used_percent);
	    this.status = this.getStatus(this.value);
	};


	var compareListByHealth = function compareListByHealth(a,b) {
	    if (healthPriorityMap[a.health.status] < healthPriorityMap[b.health.status]) return -1;
	    if (healthPriorityMap[a.health.status] > healthPriorityMap[b.health.status]) return 1;
	    if (a.name < b.name) return -1;
	    if (a.name > b.name) return 1;
	    return 0;
	};

	$scope.$watch(function () { return ClusterState.data; }, function (data) {
	    var cluster = ClusterState.data.cluster;
	    var showSidebar = cluster.length > 0;

	    $scope.renderSidebar = showSidebar;
	    var nodeList = prepareNodeList(cluster);

	    // sort nodes by health and hostname
	    nodeList = nodeList.sort(compareListByHealth);
	    // show sidebar
	    var nodeNames = nodeList.map(function(obj, idx){
		return obj.name;
	    });
	    if (selected && nodeNames.indexOf(selected)>=0) {
		var selectedNode = nodeList.filter(function(node, idx) {
		    return node.name == selected;
		});
		$scope.selected_node = selected;
		$scope.node = selectedNode[0];
	    } else {
		$scope.selected_node = '';
		$scope.node = null;
	    }
	    $scope.nodes = nodeList;
	}, true);

	var prepareNodeList = function prepareNodeList(cluster) {
	    var nodeList = [];
	    for (var i=0; i<cluster.length; i++) {
		var node = angular.copy(cluster[i]);
		node.address = "http://" + (node.hostname || "localhost") + ":" + node.port.http;
		node.health = new Health(node);
		node.health_label_class = colorMapLabel[node.health.status];
		node.health_panel_class = colorMapLabel[node.health.status];
		node.mem.total = node.mem.used + node.mem.free;
		nodeList.push(node);
	    }
	    return nodeList;
	};

	$scope.$on("$destroy", function(){
	    $interval.cancel(intervalId);
	});

	$scope.isActive = function (node_name) {
	    return node_name === $scope.selected_node;
	};

    });
