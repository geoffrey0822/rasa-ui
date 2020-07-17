angular.module('app').controller('EditIntentController', EditIntentController);

String.prototype.replaceBetween = function(start, end, what) {
  return this.substring(0, start) + what + this.substring(end);
};

function EditIntentController($rootScope, $scope, Bot, BotEntities, Intent, Expressions, Expression, Parameter, Parameters, Entities, Response, Response) {
  Bot.get({ bot_id: $scope.$routeParams.bot_id }, function (data) {
    $scope.bot = data;
  });

  BotEntities.query({ bot_id: $scope.$routeParams.bot_id }, function (data) {
    $scope.entityList = data;
  });

  Intent.get({ intent_id: $scope.$routeParams.intent_id }, function (data) {
    $scope.intent = data;
  });

  $scope._show_highlight = false;

  function compare(a, b) {
    const start_idx_a = a.parameter_start;
    const start_idx_b = b.parameter_start;

    let comparison = 0;
    if(start_idx_a>start_idx_b){
      comparison = -1;
    }else if(start_idx_a<start_idx_b){
      comparison = 1;
    }
    return comparison;
  }


  loadExpressions();

  function loadExpressions() {
    Expressions.query({ intent_id: $scope.$routeParams.intent_id }, function (data) {
      $scope.expressionList = data;
      //console.log(data);
      loadExpressionParameters2();
    });
  }

  function loadExpressionParameters() {
    Parameters.query({ intent_id: $scope.$routeParams.intent_id }, function (
      data
    ) {
      $scope.parameterList = data;
      $scope.parameterFilterList = data;
      //Loop through each parameter and highlight the words it is for
      for (let z = 0; z <= $scope.expressionList.length; z++) {
        if ($scope.expressionList[z] !== undefined) {
          let text = $scope.expressionList[z].expression_text;
          let htext = text;
          for (let i = 0; i <= data.length - 1; i++) {
            if (
              $scope.expressionList[z].expression_id === data[i].expression_id
            ) {
              //htext = highlight(text, data[i].parameter_value);
              htext = highlight2(htext, data[i].parameter_value, data[i].parameter_start, data[i].parameter_end);
            }
          }
          $scope.expressionList[z].expression_highlighted_text = htext;
        }
      }
    });
  }

  function loadExpressionParameters2() {
    Parameters.query({ intent_id: $scope.$routeParams.intent_id }, function (
        data
    ) {
      $scope.parameterList = data;
      $scope.parameterFilterList = data;
      //Loop through each parameter and highlight the words it is for
      for (let z = 0; z <= $scope.expressionList.length; z++) {
        if ($scope.expressionList[z] !== undefined) {
          let text = $scope.expressionList[z].expression_text;
          let htext = text;
          if(!$scope._show_highlight) {
            let tmp = [];
            for (let i = 0; i <= data.length - 1; i++) {
              if (
                  $scope.expressionList[z].expression_id === data[i].expression_id
              ) {
                tmp.push(data[i]);
              }
            }
            tmp.sort(compare);
            for (let i = 0; i <= tmp.length - 1; i++) {
              htext = highlight2(htext, tmp[i].parameter_value, tmp[i].parameter_start, tmp[i].parameter_end);
            }
          }
          $scope.expressionList[z].expression_highlighted_text = htext;
        }
      }
    });
  }

  $scope.updateIntentNameAndWebhook = function (intent) {
    Intent.update({ intent_id: intent.intent_id }, intent).$promise.then(
      function () {
        $rootScope.$broadcast(
          'setAlertText',
          'Intent information updated Sucessfully!!'
        );
      }
    );
  };

  $scope.runExpression = function (expression_text) {
    $rootScope.$broadcast('executeTestRequest', expression_text);
  };

  $scope.deleteIntent = function () {
    Intent.remove({ intent_id: $scope.$routeParams.intent_id }).$promise.then(
      function () {
        $scope.go('/bot/' + $scope.$routeParams.bot_id);
      }
    );
  };

  function highlight(str, word) {
    const highlighted = str.replace(
      word,
      '<span style="padding: 3px; background-color: ' +
      $scope.pastelColors() +
      '">' +
      word +
      "</span>"
    );
    return highlighted;
  }


  function highlight2(str, word, start, end) {
    const highlighted = str.replaceBetween(
        start, end,
        '<span style="padding: 3px; background-color: ' +
        $scope.pastelColors() +
        '">' +
        word +
        "</span>"
    );
    return highlighted;
  }

  $scope.toggleArrow = function (expression_id) {
    if ($('#table_expression_' + expression_id).hasClass('show')) {
      $('#icon_expression_' + expression_id)
        .removeClass('icon-arrow-up')
        .addClass('icon-arrow-down');
    } else {
      $('#icon_expression_' + expression_id)
        .removeClass('icon-arrow-down')
        .addClass('icon-arrow-up');
    }
  };

  var markSelection = (function() {
    var markerTextChar = "\ufeff";
    var markerTextCharEntity = "&#xfeff;";

    var markerEl, markerId = "sel_" + new Date().getTime() + "_" + Math.random().toString().substr(2);

    var selectionEl;

    return function(win) {
      win = win || window;
      var doc = win.document;
      var sel, range;
      // Branch for IE <= 8
      if (doc.selection && doc.selection.createRange) {
        // Clone the TextRange and collapse
        range = doc.selection.createRange().duplicate();
        range.collapse(false);

        // Create the marker element containing a single invisible character by creating literal HTML and insert it
        range.pasteHTML('<span id="' + markerId + '" style="position: relative;">' + markerTextCharEntity + '</span>');
        markerEl = doc.getElementById(markerId);
      } else if (win.getSelection) {
        sel = win.getSelection();
        range = sel.getRangeAt(0).cloneRange();
        range.collapse(false);

        // Create the marker element containing a single invisible character using DOM methods and insert it
        markerEl = doc.createElement("span");
        markerEl.id = markerId;
        markerEl.appendChild( doc.createTextNode(markerTextChar) );
        range.insertNode(markerEl);
      }

      if (markerEl) {
        // Lazily create element to be placed next to the selection
        if (!selectionEl) {
          selectionEl = doc.createElement("div");
          selectionEl.style.border = "solid darkblue 1px";
          selectionEl.style.backgroundColor = "lightgoldenrodyellow";
          selectionEl.innerHTML = "&lt;- selection";
          selectionEl.style.position = "absolute";

          doc.body.appendChild(selectionEl);
        }

        // Find markerEl position http://www.quirksmode.org/js/findpos.html
        var obj = markerEl;
        var left = 0, top = 0;
        do {
          left += obj.offsetLeft;
          top += obj.offsetTop;
        } while (obj = obj.offsetParent);

        // Move the button into place.
        // Substitute your jQuery stuff in here
        selectionEl.style.left = left + "px";
        selectionEl.style.top = top + "px";

        markerEl.parentNode.removeChild(markerEl);
      }
    };
  })();

  $scope.addParameter = function (expression_id) {
    if($scope._show_highlight){
      alert("Please switch to editing mode first!");
      return false;
    }

    var selection = window.getSelection();
    var start = selection.anchorOffset;
    var end = selection.focusOffset;
    //console.log(start);console.log(end);
    //console.log(window.getSelection());
    const selectedText = window.getSelection().toString();
    if (selectedText !== '') {
      //const expressionText = $('#expression_' + expression_id).text();
      const newObj = {};
      //console.log(expressionText.indexOf(selectedText));
      newObj.expression_id = expression_id;
      //newObj.parameter_start = expressionText.indexOf(selectedText);
      //newObj.parameter_end = newObj.parameter_start + selectedText.length;
      newObj.parameter_start = start;
      newObj.parameter_end = end;
      newObj.parameter_value = selectedText;
      newObj.intent_id = Number($scope.$routeParams.intent_id);
      Parameter.save(newObj).$promise.then(function () {
        loadExpressions();
      });

      //Make sure parameter table is open
      $('#table_expression_' + expression_id).addClass('show');
    }
  };

  $scope.deleteParameter = function (parameter_id) {
    Parameter.remove({ parameter_id: parameter_id }).$promise.then(function () {
      loadExpressions();
    });
  };

  $scope.addExpression = function () {
    const newObj = {};
    newObj.intent_id = $scope.$routeParams.intent_id;
    newObj.expression_text = this.expression_text;

    Expression.save(newObj).$promise.then(function () {
      $scope.expression_text = '';
      loadExpressions();
    });
  };

  $scope.updateParameterEntity = function (param_id, entity_id) {
    Parameter.update(
      { parameter_id: param_id },
      { parameter_id: param_id, entity_id: entity_id }
    ).$promise.then(function () {
      //loadUniqueIntentEntities();
      //loadExpressions();
    });
  };

  $scope.deleteExpression = function (expression_id) {
    Expression.remove({ expression_id: expression_id }).$promise.then(
      function () {
        loadExpressions();
      }
    );
  };

  $scope.toggleHighLight = function (v){
    $scope._show_highlight = v;
    //console.log($scope._show_highlight);
    loadExpressions();
  };
}
