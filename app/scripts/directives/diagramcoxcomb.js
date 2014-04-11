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
                        var figure = d3.select(target).append('figure');
                        // Update the chart generator settings:
                        rose.legend(config.causes)
                            .width(config.size)
                            .height(config.size)
                            .delay(0)
                            .duration(0)
                            .domain( [0, maxRadius] )
                            .angle( function(d) {
                                    return -d._id; // minus for reverse direction
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
                            if (this._drawn == true) return;
                            this._drawn = true;
                            drawGraph(new_val);
                        }, true);
                }
            }
            }]);

angular.module('diagrampie', ['stats'])
    .directive('diagramPie',
        // http://bl.ocks.org/mbostock/3887235
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

                        console.log("draw pie chart in target", target);

                        var width = config.size,
                            height = config.size,
                            radius = config.size / 2;

                        var color = d3.scale.ordinal()
                           .range(["#98abc5", "#8a89a6", "#7b6888",
                                   "#6b486b", "#a05d56", "#d0743c",
                                   "#ff8c00"]);

                       var arc = d3.svg.arc()
                           .outerRadius(radius - 10)
                           .innerRadius(0);

                       var pie = d3.layout.pie()
                           .sort(null)
                           .value(function(d) { return d[config.causes[0]]; });

                       var svg = d3.select(target).append("svg")
                           .attr("width", width)
                           .attr("height", height)
                           .append("g")
                           .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

                        for (var i=0; i<config.data.length;i++){
                            var d = config.data[i];
                            var g = svg.selectAll(".arc")
                                .data(pie(d))
                                .enter().append("g")
                                .attr("class", "arc");
                            g.append("path")
                                .attr("d", arc)
                                .style("fill", function(d) {
                                        //return color(d.data.age);
                                        return color("#98abc");
                                    });

                            g.append("text")
                                .attr("transform", function(d) {
                                        return "translate(" + arc.centroid(d) + ")";
                                    })
                                .attr("dy", ".35em")
                                .style("text-anchor", "middle")
                                .text(function(d) {
                                        return 'x'; //d.data.age;
                                    });
                        }
                    };
                    $scope.$watch('diagramconfig', function(new_val){
                            if (!new_val) return;
                            if (this._drawn == true) return;
                            this._drawn = true;
                            drawGraph(new_val);
                        }, true);
                }
            }
            }]);

