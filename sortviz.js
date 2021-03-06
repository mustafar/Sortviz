window.mrzv = window.mrzv || {};

window.mrzv.sortviz = {

  numbers: null,
  numbersSorted: null,
  traces: null,
  strokeStyle: "#000",

  init: function (numbers) {
    this.numbers = numbers;
    this.traces = {};
    this.runSortAlgorithms();
  },

  runSortAlgorithms: function () {
    var allProperties = Object.keys(this);
    for (var i = 0; i < allProperties.length; i++) {
      if (!allProperties[i].match(/Sort$/)) {
        continue;
      }
      var numbers = this[allProperties[i]]();
      if (this.numbersSorted === null) {
        this.numbersSorted = numbers;
      }
    }
  },

  initTrace: function (numbers) {
    var trace = {};
    for (var i = 0; i < numbers.length; i++) {
      trace[numbers[i]] = [];
      trace[numbers[i]][0] = i;
    }
    return trace;
  },

  registerTrace: function (name, trace, tick) {
    var fullTrace = trace;
    var maxSteps = 0;
    var i, j;
    for (i = 0; i < this.numbers.length; i++) {
      if (fullTrace[this.numbers[i]].length > maxSteps) {
        maxSteps = fullTrace[this.numbers[i]].length;
      }
    }
    maxSteps = tick > maxSteps ? tick : maxSteps;
    for (i = 0; i < this.numbers.length; i++) {
      for (j = 0; j < maxSteps; j++) {
        if (fullTrace[this.numbers[i]][j] === undefined) {
          fullTrace[this.numbers[i]][j] =
            fullTrace[this.numbers[i]][j - 1];
        }
      }
    }
    this.traces[name] = fullTrace;
  },

  swap: function (numbers, indexA, indexB, tick, trace) {
    var tmp = numbers[indexA];
    numbers[indexA] = numbers[indexB];
    numbers[indexB] = tmp;

    // track new positions
    trace[numbers[indexA]][tick] = indexA;
    trace[numbers[indexB]][tick] = indexB;
  },

  move: function (numbers, val, toPos, tick, trace) {
    numbers[toPos] = val;

    // track new position
    trace[numbers[toPos]][tick] = toPos;
  },

  bubbleSort: function () {
    var numbers = this.numbers.slice(0);
    var trace = this.initTrace(numbers);
    var tick = 0;
    for (var i = numbers.length - 1; i > 0; i--) {
      for (j = 1; j <= i; j++) {
        tick = tick + 1;
        if (numbers[j - 1] > numbers[j]) {
          this.swap(numbers, j - 1, j, tick, trace);
        }
      }
    }
    this.registerTrace("Bubble Sort", trace, tick);
    return numbers;
  },

  selectionSort: function () {
    var numbers = this.numbers.slice(0);
    var trace = this.initTrace(numbers);
    var tick = 0;
    for (var i = 0; i < numbers.length - 1; i++) {
      var minPos = i;
      for (j = i + 1; j < numbers.length; j++) {
        tick = tick + 1;
        if (numbers[minPos] > numbers[j]) {
          minPos = j;
        }
      }
      this.swap(numbers, minPos, i, tick, trace);
    }
    this.registerTrace("Selection Sort", trace, tick);
    return numbers;
  },

  insertionSort: function () {
    var numbers = this.numbers.slice(0);
    var trace = this.initTrace(numbers);
    var tick = 0;
    for (var i = 1; i < numbers.length; i++) {
      toInsert = numbers[i];
      for (var j = 0; j < i; j++) {
        tick = tick + 1;
        if (numbers[j] > toInsert) {
          break;
        }
      }
      for (var k = i; k > j; k--) {
        this.move(numbers, numbers[k - 1], k, tick, trace);
      }
      this.move(numbers, toInsert, j, tick, trace);
    }
    this.registerTrace("Insertion Sort", trace, tick);
    return numbers;
  },

  mergeSort: function () {
    var numbers = this.numbers.slice(0);
    var trace = this.initTrace(numbers);
    var tick = this.mergeSortPass(numbers, trace, 0, 0, numbers.length - 1);
    this.registerTrace("Merge Sort", trace, tick);
    return numbers;
  },

  mergeSortPass: function (numbers, trace, tick, start, stop) {
    if (stop > start) {
      var mid = start + Math.floor(((stop - start) / 2));
      tick = this.mergeSortPass(numbers, trace, tick, start, mid);
      tick = this.mergeSortPass(numbers, trace, tick, mid + 1, stop);
      tick = this.mergeSortMerge(numbers, trace, tick, start, mid, stop);
    }
    return tick;
  },

  mergeSortMerge: function (numbers, trace, tick, start, mid, stop) {
    var left = start;
    var right = mid + 1;
    tick = tick + 1;
    if (numbers[mid] <= numbers[right]) {
      return tick;
    }
    while (left <= mid && right <= stop) {
      tick = tick + 1;
      if (numbers[left] < numbers[right]) {
        left++;
      } else {
        var tmp = numbers[right];
        for (var k = right; k > left; k--) {
          this.move(numbers, numbers[k - 1], k, tick, trace);
        }
        this.move(numbers, tmp, left, tick, trace);
        left++;
        mid++;
        right++;
      }
    }
    return tick;
  },

  drawGraph: function (canvas, graphName) {
    var context = canvas.getContext('2d');
    height = canvas.height;
    width = canvas.width;

    var trace = this.traces[graphName];
    var numLines = this.numbers.length;
    var numPointsPerLine = trace[this.numbers[0]].length - 1;

    //Padding between points.
    var heightPadding = 0.75 * height / numLines;
    var paddingTopForTitle = 0.2 * height;
    var widthPadding = 0.8 * width / numPointsPerLine;
    var paddingLeft = 0.1 * width;

    for (var i = 0; i < numLines; i++) {
      var number = this.numbers[i];
      var data = trace[number];
      var xPrev = null,
        yPrev = null;
      for (var tick = 0; tick < data.length; tick++) {
        var x = (tick * widthPadding) + paddingLeft;
        var y = (data[tick] * heightPadding) + paddingTopForTitle;
        if (xPrev === null && yPrev === null) {
          xPrev = x;
          yPrev = y;
        }

        // plot
        context.strokeStyle = this.strokeStyle;
        context.lineWidth = 3;
        context.moveTo(xPrev, yPrev);
        context.bezierCurveTo((xPrev + x) / 2, yPrev, (xPrev + x) / 2,
          y, x, y);
        context.stroke();

        // remember last point
        xPrev = x;
        yPrev = y;
      }
    }

    // write title
    fontSize = 0.15 * (height > width ? width : height);
    context.textBaseline = 'top';
    context.lineWidth = 1;
    context.font = fontSize + 'px Arial';
    context.strokeText(graphName, paddingLeft, 0);
    context.font = 'Normal 14px Arial';
    context.strokeText('Time: ' + numPointsPerLine, 0.75 * width, 10);
  },

  wipe: function (containerName) {
    var container = document.getElementById(containerName);
    container.innerHTML = '';
  },

  draw: function (containerName, strokeColor) {
    if (strokeColor) {
      this.strokeStyle = strokeColor;
    }
    var container = document.getElementById(containerName);
    var height = container.offsetHeight;
    var width = container.offsetWidth;
    var graphs = Object.keys(this.traces);
    var numGraphs = graphs.length;

    // figure out layout
    graphHeight = height;
    graphWidth = width;
    if (numGraphs > 1) {
      // try 2-col first
      var tmpWidth = width / 2;
      var numRows = Math.ceil(numGraphs / 2);
      var tmpHeight = height / numRows;
      if (tmpHeight <= tmpWidth) {
        graphHeight = tmpHeight;
        graphWidth = tmpWidth;
      } else {
        graphHeight = height / 2;
        var numCols = Math.ceil(numGraphs / 2);
        graphWidth = width / numCols;
      }
    }

    // draw graphs
    for (var i = 0; i < numGraphs; i++) {
      var graphCanvasName = 'canvas_' + i;
      var graphCanvas = document.createElement('canvas');
      graphCanvas.id = graphCanvasName;
      graphCanvas.height = graphHeight;
      graphCanvas.width = graphWidth;
      container.appendChild(graphCanvas);
      this.drawGraph(graphCanvas, graphs[i]);
    }
  }
};
