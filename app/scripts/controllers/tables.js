'use strict';

angular.module('tables', ['stats', 'sql', 'common', 'tableinfo'])
  .controller('TablesController', function ($scope, $location, $log, $timeout, $routeParams,
        SQLQuery, queryResultToObjects, roundWithUnitFilter, bytesFilter, TableInfo) {
    var refreshInterval = 5000;

    var colorMapPanel = {'good': 'panel-success',
                    'warning': 'panel-warning',
                    'critical': 'panel-danger',
                    '--': 'panel-default'};
    var colorMapLabel = {'good': '',
                    'warning': 'label-warning',
                    'critical': 'label-danger',
                    '--': ''};

    var selected_table = $routeParams.table_name || '';

    var empty_table = {
      'name': 'Tables (0 found)',
      'summary': '',
      'health': '--',
      'health_label_class': '',
      'health_panel_class': '',
      'records_total': 0,
      'records_replicated': 0,
      'records_underreplicated': 0,
      'records_unavailable': 0,
      'shards_configured': 0,
      'shards_started': 0,
      'shards_active': 0,
      'shards_missing': 0,
      'shards_underreplicated': 0,
      'replicas_configured': '0',
      'size': 0
    };

    var TableInfoProvider = {
      setEmpty: function setEmpty() {
        $scope.tables = [];
        $scope.table = angular.copy(empty_table);
        $scope.selected_table = '';
        $scope.renderSidebar = false;
        $scope.renderSchema = false;
      },
      update: function update(success, tables, shards) {
        var _tables = tables || [];
        var _shards = shards || [];

        if (success && _tables.length) {
          $scope.renderSidebar = true;
          $scope.renderSchema = true;
          for (var i=0; i<_tables.length; i++) {
            var table = _tables[i];
            var tableInfo = new TableInfo(_shards.filter(function(shard, idx) { return table.name === shard.name; }));
            tableInfo.shards_configured = table.shards_configured;

            table.health = tableInfo.health();
            table.health_label_class = colorMapLabel[table.health];
            table.health_panel_class = colorMapPanel[table.health];
            table.records_total = tableInfo.totalRecords();
            table.records_underreplicated = tableInfo.underreplicatedRecords();
            table.records_replicated = table.records_total - table.records_underreplicated;
            table.records_unavailable = tableInfo.unavailableRecords();
            table.shards_started = tableInfo.startedShards();
            table.shards_missing = tableInfo.missingShards();
            table.shards_underreplicated = tableInfo.underreplicatedShards();
            table.size = tableInfo.size();
          };

          var currentTable = _tables.filter(function(table, idx) { return table.name === selected_table; });
          $scope.tables = _tables.sort(compareListByHealth);
          $scope.table = currentTable.length ? currentTable[0] : _tables[0];
          $scope.selected_table = $scope.table.name;

          // query for table schema
          var query = SQLQuery.execute(
            "select column_name, data_type from information_schema.columns " +
            "where table_name = '"+$scope.selected_table+"'");

          query.success(function(sqlQuery){
            $scope.schemaHeaders = sqlQuery.cols;
            $scope.schemaRows = sqlQuery.rows;
            $scope.renderSchema = true;
          }).error(function(sqlQuery) {
            $scope.renderSchema = false;
          });

        } else {
          TableInfoProvider.setEmpty();
        }
      },
      fetch: function fetch() {
        SQLQuery.execute('select table_name, number_of_shards, number_of_replicas ' +
            'from information_schema.tables ' +
            'where schema_name = \'doc\'').
          success(function(sqlQuery1){
            SQLQuery.execute('select table_name, sum(num_docs), "primary", avg(num_docs), count(*), state, sum(size) '+
                'from sys.shards group by table_name, "primary", state ' +
                'order by table_name, "primary"').
              success(function(sqlQuery2) {
                var tables = queryResultToObjects(sqlQuery1, ['name', 'shards_configured', 'replicas_configured']);
                var shards = queryResultToObjects(sqlQuery2, ['name', 'sum_docs', 'primary', 'avg_docs', 'count', 'state', 'size']);
                TableInfoProvider.update(true, tables, shards);
              }).
              error(function(sqlQuery) {
                var tables = queryResultToObjects(sqlQuery1, ['name', 'shards_configured', 'replicas_configured']);
                TableInfoProvider.update(true, tables);
              });
          }).
          error(function(sqlQuery) {
            TableInfoProvider.update(false);
          });
        var promise = $timeout(TableInfoProvider.fetch, refreshInterval);
        $scope.$on('$destroy', function(){
          $timeout.cancel(promise);
        });
      }
    };

    TableInfoProvider.fetch();

    $scope.isActive = function (table_name) {
      return table_name === $scope.selected_table;
    };

    var healthPriorityMap = {
      'good': 2,
      'warning': 1,
      'critical': 0,
      '--': 0
    };

    function compareListByHealth(a,b) {
      if (healthPriorityMap[a.health] < healthPriorityMap[b.health]) return -1;
      if (healthPriorityMap[a.health] > healthPriorityMap[b.health]) return 1;
      return 0;
    }

    // bind tooltips
    $("[rel=tooltip]").tooltip({ placement: 'top'});

    // sidebar button handler (mobile view)
    $scope.toggleSidebar = function() {
      $("#wrapper").toggleClass("active");
    };

  });