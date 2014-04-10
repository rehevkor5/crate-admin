'use strict';

angular.module('diagramcoxcomb', ['stats'])
    .directive('diagramCoxcomb',
        [function(){
            return{
                restrict: 'E',
                templateUrl: '/views/diagramcoxcomb.html',
                scope: {
                    diagramconfig: '='
                },
                link: function($scope, element){
                    $scope.id = Math.round(Math.random()*1000000);
	                var drawGraph = function drawGraph(config){
                        var target = $("#"+$scope.id)[0];
		                $(target).empty();
		                var rose = Chart.rose();
                        // Get the maximum value:
                        var maxVal = d3.max(config.data, function(d) {
                                var max = 0;
                                for (var i=0; i<config.causes.length;i++){
                                    max+=d[config.causes[i]];
                                }
                                return max;
                            });
                        // Where the maximum value gives us the maximum radius:
                        var maxRadius = Math.sqrt(maxVal*config.data.length / Math.PI);
                        // Append a new figure to the DOM:
                        var figure = d3.select(target).append( 'figure' );
                        // Update the chart generator settings:
                        rose.legend(config.causes)
                            .width(config.size)
                            .height(config.size)
                            .delay(0)
                            .duration(0)
                            .domain( [0, maxRadius] )
                            .angle( function(d) {
                                return d._id;
                            })
                            .area( function(d, i) {
                                var area = new Array();
                                for (var i=0; i<config.causes.length; i++){
                                    area.push(d[config.causes[i]]);
                                }
                                return area;
                            });
                        // Bind the data and generate a new chart:
                        figure.datum(config.data)
                            .attr('class', 'chart figure1')
                            .call(rose);
                    };

                    $scope.$watch('diagramconfig', function(new_val){
                            if (!new_val) return;
                            drawGraph(new_val);
                        }, true);
                }
            }
            }]);