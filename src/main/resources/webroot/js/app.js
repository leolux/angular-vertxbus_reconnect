'use strict';

var useExplicitReconnect = true; //true to reproduce issues

angular.module('myApp', ['ngRoute', 'knalli.angular-vertxbus']).config(
  ['$routeProvider', 'vertxEventBusProvider', 'vertxEventBusServiceProvider',
    function ($routeProvider, vertxEventBusProvider, vertxEventBusServiceProvider) {
      $routeProvider.when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })

      if (useExplicitReconnect) {
        //Issues appear
        vertxEventBusProvider.enable().useReconnect(false); //<-- send() not possible after reconnect
      } else {
       //Issues do not appear
        vertxEventBusProvider.enable().useReconnect(true); //<--everything works after reconnect
      }

      vertxEventBusServiceProvider.enable().useMessageBuffer(1) // total amount of buffered messages
    }]);

angular.module('myApp').controller(
  'MainCtrl',
  [
    '$scope', '$interval',
    'vertxEventBusService', 'vertxEventBus',
    function ($scope, $interval, vertxEventBusService, vertxEventBus) {
      $scope.main = this;
      $scope.main.state = 'disconnected';
      $scope.main.output = '';

      $scope.$on('vertx-eventbus.system.disconnected', function (event) {
        $scope.main.state = 'disconnected';
        $scope.main.output += 'disconnected' + '\r\n';
        vertxEventBus.reconnect(true);
        if (useExplicitReconnect) {
          startReconnecting();
        }
      });

      $scope.$on('vertx-eventbus.system.connected', function (event) {
        $scope.main.state = 'connected';
        $scope.main.output += 'connected' + '\r\n';
        console.log('connected');
        if (useExplicitReconnect) {
          stopReconnectTimeout();
        }
      });

      var reconnectTimer = null;

      function startReconnecting() {
        console.log('reconnectTimer started');
        reconnectTimer = $interval(function () {
          vertxEventBus.reconnect(true);
        }, 4000);
      }

      function stopReconnectTimeout() {
        if (reconnectTimer !== undefined && reconnectTimer !== null) {
          $interval.cancel(reconnectTimer);
          console.log('reconnectTimer stoped');
        }
      }

      $scope.main.doRegister = function () {
        // register Listener
        registerBusListener(vertxEventBusService, function (message) {
          $scope.main.output += message + '\r\n';
        });
      };

      $scope.main.doUnregister = function () {
        // unregister listener
        unregisterBusListener(vertxEventBusService);
      };

      $scope.main.doSendToServer = function () {
        $scope.main.output += 'Send dummy msg to server \r\n';

        //Expect reply from server
        vertxEventBusService.send('inbound.test', {'msg': 'dummy'}, {}, {
          timeout: 15000,
          expectReply: true
        }).then(function (reply) {
          $scope.main.output += reply.body + '\r\n';
        }).catch(function (err) {
          console.log('No response received; Error: ' + err);
        });
      };
    }]);

var unregisterfn = null;

function registerBusListener(vertxEventBusService, callback) {
  unregisterfn = vertxEventBusService.on('outbound.test', function (message) {
    console.log('<<<<<<<<<< ', message);
    callback(message);
  });
  console.log('Listener registered');
}

function unregisterBusListener(vertxEventBusService) {
  if (typeof unregisterfn === 'function') {
    unregisterfn();
    console.log('Listener unregistered');
  }
}
