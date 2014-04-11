'use strict';

angular.module('charts', ['stats'])
  .directive('diagramCoxcomb', [function() {
    return {
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
            .domain( [0, maxRadius] )
            .angle( function(d) {
              return -d._id; // minus for reverse direction
            })
            .area( function(d, i) {
              var area = new Array();
              for (var j=0; j<config.causes.length; j++){
                area.push(d[config.causes[j]]);
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
    };
  }])
  .directive('diagramPie', [function(){
    // http://bl.ocks.org/mbostock/3887235
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

          var width = config.size,
              height = config.size,
              radius = config.size / 2;

          var colorRange = config.colors || ["#98abc5", "#8a89a6", "#7b6888",
                                             "#6b486b", "#a05d56", "#d0743c",
                                             "#ff8c00"];
          var color = d3.scale.ordinal()
                .range(colorRange);

          var arc = d3.svg.arc()
                .outerRadius(radius - 10)
                .innerRadius(0);

          var pie = d3.layout.pie()
                .sort(null)
                .value(function(d) { return d.value; });

          var svg = d3.select(target).append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

          var g = svg.selectAll(".arc")
                .data(pie(config.data))
                .enter().append("g")
                .attr("class", "arc");
          g.append("path")
            .attr("d", arc)
            .attr("class", function(d){
              return [d.data.label].join(" ");
            })
            .style("fill", function(d) {
              return color(d.data.label);
            });

	  if (config.showLabels) {
            g.append("text")
              .attr("transform", function(d) {
		return "translate(" + arc.centroid(d) + ")";
              })
              .attr("dy", ".35em")
              .style("text-anchor", "middle")
              .text(function(d) {
		return d.data.label;
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
    };
  }])
  .directive('diagramLine', [function(){
    // http://bl.ocks.org/mbostock/1166403
    return{
      restrict: 'E',
      templateUrl: '/views/diagramcoxcomb.html',
      scope: {
        diagramconfig: '='
      },
      link: function($scope, element){
        $scope.id = Math.round(Math.random()*1000000);
        var drawGraph = function drawGraph(config){
	  var data = [],
	      counter = 0,
	      now = new Date().getTime(),
	      d = config.data[0];
	  for (var i=0; i<d.length; i++){
	    data.push({
		date: now-1000*counter,
	        value: d[i]
	    });
	    counter++;
	  }
	  console.log(data);
          var target = $("#"+$scope.id)[0];
          $(target).empty();

          var width = config.width,
              height = config.height;

          var colorRange = config.colors || ["#98abc5", "#8a89a6", "#7b6888",
                                             "#6b486b", "#a05d56", "#d0743c",
                                             "#ff8c00"];
          var color = d3.scale.ordinal()
                .range(colorRange);

	  var x = d3.scale.linear().domain([0, 100]).range([0, width]),
	      y = d3.scale.linear().domain([0, 10]).range([height, 0]),
	      xAxis = d3.svg.axis().scale(x).tickSize(-height).tickSubdivide(true),
	      yAxis = d3.svg.axis().scale(y).ticks(4).orient("right");

	  var area = d3.svg.area()
		.interpolate("monotone")
		.x(function(d) { return x(d.date); })
		.y0(height)
		.y1(function(d) { return y(d.value); });

	  // A line generator, for the dark stroke.
	  var line = d3.svg.line()
		.interpolate("monotone")
		.x(function(d) { return x(d.date); })
		.y(function(d) { return y(d.value); });

          var svg = d3.select(target).append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g");

	  // Add the clip path.
	  svg.append("clipPath")
	    .attr("id", "clip")
	    .append("rect")
	    .attr("width", width)
	    .attr("height", height);

	  // Add the area path.
	  svg.append("path")
	    .attr("class", "area")
	    .attr("clip-path", "url(#clip)")
	    .attr("d", area(data));

	  // Add the x-axis.
	  svg.append("g")
	    .attr("class", "x axis")
	    .attr("transform", "translate(0," + height + ")")
	    .call(xAxis);

	  // Add the y-axis.
	  svg.append("g")
	    .attr("class", "y axis")
	    .attr("transform", "translate(" + width + ",0)")
	    .call(yAxis);

	  // Add the line path.
	  svg.append("path")
	    .attr("class", "line")
	    .attr("clip-path", "url(#clip)")
	    .attr("d", line(data));

	  // Add a small label for the symbol name.
	  svg.append("text")
	    .attr("x", width - 6)
	    .attr("y", height - 6)
	    .style("text-anchor", "end")
	    .text(data[0].symbol);

        };

        $scope.$watch('diagramconfig', function(new_val){
          if (!new_val) return;
          if (this._drawn == true) return;
          this._drawn = true;
          drawGraph(new_val);
        }, true);
      }
    };
  }]);

