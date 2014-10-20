'use strict';

angular.module('console', ['sql'])
  .directive('shell', function(SQLQuery, $timeout){
    return {
      restrict: 'E',
      transclude: true,
      templateUrl: 'views/shell.html',
      scope: {},
      controller: function($scope){

        var cli = null;
        var typedStatement = "";
        var rows = [];
        var resultHeaders = [];
        var renderTable = false;
        var recentQueries = [];

        $scope.error = {
          hide: true,
          message: ''
        };
        $scope.info = {
          hide: true,
          message: ''
        };

        this.setCli = function(scope) {
          cli = scope;
        };

        var loadingIndicator = Ladda.create(document.querySelector('button[type=submit]'));

        $scope.storeInLocalStorageChanged = function() {
          localStorage.setItem('crate.console.store_queries', useLocalStorage === true ? "1" : "0");
        };

        var getRecentQueriesFromLocalStorage = function() {
          var queryList = localStorage.getItem("crate.console.query_list");
          recentQueries = queryList ? JSON.parse(queryList) : [];
        };

        var updateRecentQueries = function(stmt) {
          if (useLocalStorage) {
            getRecentQueriesFromLocalStorage();
          }
          if (recentQueries[recentQueries.length -1] !== stmt) {
            recentQueries.push(stmt + ";");
          }
          if (useLocalStorage) {
            localStorage.setItem("crate.console.query_list", JSON.stringify(recentQueries));
          }
          typedStatement = "";
          cli.recentCursor = -1;
        };

        $scope.hide = function hide(item){
          item.hide = true;
          item.message = '';
        };

        $scope.toggleOptions = function toggleOptions(){
          $('#console-options').slideToggle();
          $scope.info.hide = true;
          $scope.info.message = '';
        };

        $scope.clearLocalStorage = function() {
          var history = JSON.parse(localStorage.getItem("crate.console.query_list") || '[]');
          localStorage.setItem("crate.console.query_list", JSON.stringify([]));
          cli.recentCursor = 0;
          recentQueries = [];
          var msg = history.length == 1 ? "1 entry in console history has been cleared." :
            history.length + " entries in console history have been cleared.";
          $scope.info.message = msg;
          $scope.info.hide = false;
        };

        var doStoreQueries = localStorage.getItem("crate.console.store_queries") || '1';
        var useLocalStorage = !!parseInt(doStoreQueries);
        getRecentQueriesFromLocalStorage();


        this.execute = function(sql) {
          var stmt = sql.replace(/^\s+|\s+$/g, '');

          if (stmt === "") return;
          stmt = stmt.replace(/([^;]);+$/, "$1");
          if (stmt.match(/^\s*select\s/ig) && !stmt.match(/limit\s+\d+/ig)) stmt += " limit 100";

          updateRecentQueries(stmt);

          loadingIndicator.start();

          SQLQuery.execute(stmt)
          .success(function(sqlQuery) {
            loadingIndicator.stop();
            $scope.error.hide = true;
            $scope.error.message = '';
            $scope.info.hide = true;
            $scope.info.message = '';
            $scope.renderTable = true;

            $scope.resultHeaders = [];
            for (var col in sqlQuery.cols) {
              $scope.resultHeaders.push(sqlQuery.cols[col]);
            }

            $scope.rows = sqlQuery.rows;
            $scope.status = sqlQuery.status();
            $scope.statement = stmt + ";";

            cli.updateInput($scope.statement);
          })
          .error(function(sqlQuery) {
            loadingIndicator.stop();
            $scope.error.hide = false;
            $scope.renderTable = false;
            $scope.error.message = sqlQuery.error.message;
            $scope.status = sqlQuery.status();
            $scope.rows = [];
            $scope.resultHeaders = [];
          });
        };

        this.recentQueries = recentQueries;
        this.typedStatement = typedStatement;

      }
    };
  })
  .directive('cli', function($timeout){
    return {
      restrict: 'E',
      transclude: true,
      templateUrl: 'views/cli.html',
      scope: {
        mimeType: '=',
        theme: '='
      },
      require: '^shell',
      link: function(scope, element, attrs, shell) {
        scope.recentCursor = 0;
        shell.setCli(scope); // register cli

        var statement = "";
        var input = $('textarea',element)[0];
        var editor = CodeMirror.fromTextArea(input, {
          mode: attrs.mimeType,
          theme: attrs.theme
        });

        var selectStatementInput = function(stmt) {
          if (stmt) {
            editor.setValue(stmt);
          }
          $timeout(function() {
            editor.execCommand('selectAll');
          }, 10);
        };

        scope.updateInput = function(stmt){
          selectStatementInput(stmt);
        };

        editor.on('change', function(instance, changeObj){
          statement = instance.getValue();
        });

        editor.on('keydown', function(instance, event){

          var cursorPos = event.target.selectionStart,
              queryCount = shell.recentQueries.length,
              semicolonPos = statement.indexOf(';'),
              cursor = instance.getCursor(),
              selection = instance.getSelection();

          if (!event.shiftKey && event.keyCode === 38) {
            // UP KEY
            if ((cursor.ch === 0 && cursor.line === 0) || (cursor.line === 0 && selection === statement)) {
              if (scope.recentCursor === 0) {
                shell.typedStatement = statement;
              }
              scope.recentCursor--;
              statement = shell.recentQueries[queryCount + scope.recentCursor];
              selectStatementInput(statement);
            }
          } else if (!event.shiftKey && event.keyCode === 40) {
            // DOWN KEY
            if (cursorPos >= event.target.textLength || cursorPos === 0 && event.target.selectionEnd === statement.length) {
              if (queryCount + scope.recentCursor < queryCount) {
                scope.recentCursor++;
                statement = shell.recentQueries[queryCount + scope.recentCursor] || shell.typedStatement;
                selectStatementInput(statement);
              }
            }
          } else if (event.keyCode === 13 && !!event.shiftKey) {
            // ENTER KEY
            if (semicolonPos != -1) {
              event.preventDefault();
              shell.execute(statement);
            }
          } else {
            scope.recentCursor = 0;
          }
        });

      }
    };
  })
  .controller('ConsoleController', function ($scope, $http, $location, SQLQuery, $log, $timeout) {
  });
