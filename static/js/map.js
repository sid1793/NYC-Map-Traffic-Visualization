//the original
var map = L.map('map').setView([40.7841484, -73.9661407], 13);


var tile = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw', {
  maxZoom: 18,
  attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
    '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery © <a href="http://mapbox.com">Mapbox</a>',
  id: 'mapbox.streets'
}).addTo(map);
console.log(map);
// $('.dropdown-toggle').dropdown();

var gCamName='';
var gStartTime = new Date('2015-12-05 08:00:00');
var gEndTime = new Date('2015-12-05 14:00:00');
var gStartDate = new Date('2015-12-05 00:00:00');
var gEndDate = new Date('2015-12-20 00:00:00');

var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);
var drawControl = new L.Control.Draw({
    edit: {
        featureGroup: drawnItems
    }
});

map.addControl(drawControl);
 map.on('draw:created', function (e) {
    latest_bounding_box = e.layer.getLatLngs();
    console.log (latest_bounding_box);
    update_wordcloud ();
});

var latest_bounding_box;

function update_wordcloud ()
{
    var sD = gStartDate.toLocaleDateString();
    var eD = gEndDate.toLocaleDateString();
    var sT = gStartTime.toLocaleTimeString();
    var eT = gEndTime.toLocaleTimeString();
    $.post('/wordCloud',{
      coord:JSON.stringify(latest_bounding_box),
      startDate: sD,
      endDate: eD,
      startTime: sT,
      endTime: eT
    });
    document.getElementById('word_cloud').src="static/img/wordcloud.png?" + new Date().getTime();  
}

var lastTimeout;

var time_updated_for_images = false;


function refreshImage(cName,starttime,endtime,curtime) {//the times are Date object

  //console.log("refreshImage")
  //var data;
  var hour = 60 * 60 * 1000;
  var nexttime = new Date(curtime.valueOf()+hour);
  strcurtime = curtime.toLocaleString();
  strstarttime = starttime.toLocaleString();
  strendtime = endtime.toLocaleString();
  strnexttime = nexttime.toLocaleString();


  console.log (endtime);
  console.log (nexttime);
  console.log (endtime.getTime() < nexttime.getTime());


  if(endtime.getTime() < nexttime.getTime() ){
    $.get( "/images",{camname:cName, starttime: strcurtime,endtime: strendtime}, function( data, status ) {//
      //console.log(data);
      if(data.length>100){
        document.getElementById("myPic").src='data:image/jpeg;base64, '+data+'';
      }
    });
    curtime = starttime;
  }else{
    //document.getElementById(imageID).src ="data:image/jpeg;base64, '+data+'?math=';
    $.get( "/images",{camname:cName,starttime:strcurtime ,endtime:strnexttime}, function( data, status ) {//   
      //console.log(data);
      if(data.length>100){
        document.getElementById("myPic").src='data:image/jpeg;base64, '+data+'';
      }
    });
    curtime = nexttime;
  }

  if (time_updated_for_images){
    lastTimeout = setTimeout(refreshImage,1000,gCamName,gStartTime,gEndTime,gStartTime);
    time_updated_for_images = false;
  }
  else
    lastTimeout = setTimeout(refreshImage,1000,cName,starttime,endtime,curtime);

}


var alerttype = "";
var alertsLOC = [];
var alertLayer = L.layerGroup().addTo(map);
function alert_type(type,name){//e.g.true, hazard
  
  if (type){
		alerttype = name;
		var alertBtn = document.getElementById("alertBtn");
		alertBtn.innerHTML=name+"<span class='caret'></span>";
  }
  
  // alertBtn.setAttribute('aria-haspopup','true');
  // alertBtn.setAttribute('aria-expanded','true');
  // var d = new Date("2015-12-07 12:00:00");
  // var sd = d.toLocaleDateString();
  // var sh = d.getHours();
  // var dd = new Date("2015-12-09 13:00:00");
  // var sdd = dd.toLocaleDateString();
  // var shh = dd.getHours();
  var sD = gStartDate.toLocaleDateString();
  var eD = gEndDate.toLocaleDateString();
  var sT = gStartTime.toLocaleTimeString();
  var eT = gEndTime.toLocaleTimeString();
  //just for test 
  $.get( "/alerts",{typename:alerttype, startD: sD, startT: sT, endD: eD, endT: eT}, function( data, status ) {//
    //startDT and endDT are does not have real meaning here,  gStartTime.toLocalString gEndTime
    //it should be break down into time and date on the backend
    //data should be a json
    //need to add code in render all for drawing layer.
    // console.log(data);
    // console.log(typeof(data));
    //console.log(data[0]);//undifined
    //alertsLOC.push(data.coords);
    alertsLOC = data.coords;
    // console.log(alertsLOC);
    console.log(alertsLOC[0]);
    // console.log(alertsLOC[0][0]);
    // console.log(alertsLOC.length); // 12

    console.log(alertsLOC.length);
    // var circles = [];
    alertLayer.clearLayers();
    for (var i = alertsLOC.length - 1; i >= 0; i--) {
      // circles.push(L.circle(alertsLOC[i], 50, { color: 'red', fillColor: '#f03', fillOpacity: 0.5 }));
      var c = L.circle(alertsLOC[i], 20, { color : 'green', opacity:1, fillColor: 'green',fillOpacity: 1 });
      alertLayer.addLayer(c);
      
      // L.circle(alertsLOC[i], 500, { color: 'red', fillColor: '#f03' }).addTo(map);
      // console.log(alertsLOC[i]);
    }
      // console.log(alertLayer);


    // map.addLayer(alertLayer);
  });

}


var imageOn = false;
// var markers = [];
var markers = new Array();
var camLayer = L.layerGroup().addTo(map);
var cams;
d3.csv("static/data/cam_coordinates.json", function(error, data) {
  cams = data;
  //cams = {{cam_data|safe}}
  // var starttime = new Date(extent[0]);//this data need to be obtained from the brush//'2015-12-07 07:00:03'
  // var endtime = new Date(extent[1]);//'2015-12-08 08:15:00'
//this is for fixed time
  // var starttime = new Date('2015-12-07 07:00:03');//this data need to be obtained from the brush//
  // var endtime = new Date('2015-12-08 08:15:00');//'2015-12-08 08:15:00'
  // console.log(endtime);

    //console.log(cams[0],cams[0].lat,cams[0].log, cams.length, cams[0].camera);
  for(var i = 0; i<cams.length; ++i){
    ///console.log()
    var marker = L.marker([cams[i].lat,cams[i].log], {icon: cam},{title: cams[i].camera}).addTo(map);
    //var marker = L.marker([cams[i][1],cams[i][2]], {icon: cam},{title: cams[i][0]}).addTo(map);
    window.markers.push(marker);
    camLayer.addLayer(marker);
    //marker.bindPopup("<img src=\"\" alt=\"camera_image\" name=\"myCam\" width=\"305\" height=\"210\" border=\"0\" align=\"middle\" id=\"myPic\"><br>"+cams[i].camera);//originally width=\"352\" height=\"240\"
    window.markers[i].bindPopup(cams[i].camera);//originally width=\"352\" height=\"240\" name = "myCam"

    var camID = cams[i].camera;
    //console.log(window.markers[i]);
    window.markers[i].on('click',function(e){//window.markers[i].title
      //console.log(window.markers[i]);
      //console.log(e.target._popup._content);


      if (!imageOn){
        imageOn = true;
        gCamName = e.target._popup._content;
        setTimeout(refreshImage,1000,gCamName,gStartTime,gEndTime,gStartTime);
      }
      else {
        if (gCamName == e.target._popup._content){
          imageOn = false;
          try{
            clearTimeout (lastTimeout);
          }
          catch(err){
            console.log (err);
          }
//          document.getElementById("myPic").src='';
        }
        else {
          gCamName = e.target._popup._content;
          time_updated_for_images = true;
        }
      }      
      //when using fixed time
      /*
      gStartTime = starttime;
      gEndTime = endtime;
      */

      console.log(gStartTime);
      console.log(gEndTime);
      //console.log()

      
//This is for fixed time
      // setTimeout(refreshImage,1000,e.target._popup._content,starttime,endtime,starttime);

      //document.getElementById("myPic").src='data:image/jpeg;base64, '+data+'';
    });
  }
});


// setTime(window.gStartTime, extent[0]);
function setTime(time,num){
  var hour = Math.floor(num);
  var min = (num - hour)*60;
  time.setHours(hour,min);
  //time.setMinutes();
}
function setDate(date,dObj){
  date = new Date(dObj.getFullYear(),dObj.getMonth(), dObj.getDate(), 0,0,0,0);
}




var cam = L.icon({
    iconUrl: 'static/img/video_camera_black.png',//black
    shadowUrl: 'static/img/video_camera_grey.png',

    iconSize:     [24, 24], // size of the icon
    shadowSize:   [26, 26], // size of the shadow
    iconAnchor:   [12, 12], // point of the icon which will correspond to marker's location
    shadowAnchor: [13, 13],  // the same for the shadow
    popupAnchor:  [-3, -10] // point from which the popup should open relative to the iconAnchor
});





///////  Heat map
var heatmap = new L.TileLayer.HeatCanvas({},{'step':1,
'degree':HeatCanvas.LINEAR, 'opacity':0.7});

heatmap_switched = false;


var checkbox = document.getElementById("heatmap_on");
function switch_heatmap(){
    if(checkbox.checked == true){
        map.addLayer(heatmap);
    }
    else {
        map.removeLayer(heatmap);
    }
};

var heatType = "car";

// (It's CSV, but GitHub Pages only gzip's JSON at the moment.)
d3.csv("static/data/data.json", function(error, data) {
  
  var norm_den = 24.0;
  var norm_req = false;

  document.getElementById("radio1").onclick=function (heatRadio)
  {
    heatmap_switched = true;
    window.heatType = "bus";  
    renderAll ();
  };
  document.getElementById("radio2").onclick=function (heatRadio)
  {
    heatmap_switched = true;
    window.heatType = "car";  
    renderAll ();
  };
  document.getElementById("radio3").onclick=function (heatRadio)
  {
    heatmap_switched = true;
    window.heatType = "person";  
    renderAll ();
  };

  var chb_norm = document.getElementById("heatmap_normal");
  chb_norm.onchange=function ()
  {
    if (chb_norm.checked)
      norm_req = true;
    else
      norm_req = false;
    renderAll ();
  };

  // Various formatters.
  var formatNumber = d3.format(",d"),
      formatChange = d3.format("+,d"),
      formatDate = d3.time.format("%B %d, %Y"),//%B - full month name.%d - zero-padded day of the month as a decimal number [01,31].%Y - year with century as a decimal number.
      formatTime = d3.time.format("%I:%M %p");//%I - hour (12-hour clock) as a decimal number [01,12].%M - minute as a decimal number [00,59].%p - either AM or PM.

  // A nest operator, for grouping the flight list.
  var nestByDate = d3.nest()
      .key(function(d) { return d3.time.day(d.date); });

  // A little coercion, since the CSV is untyped.
  data.forEach(function(d, i) {
    d.index = i;
    d.date = parseDate(d.datetime);
  });

  // Create the crossfilter for the relevant dimensions and groups.
  var xfilter = crossfilter(data),
      all = xfilter.groupAll(),
      date = xfilter.dimension(function(d) { return d.date; }),
      hour = xfilter.dimension(function(d) { return d.date.getHours() + d.date.getMinutes() / 60; }),

      datesGroupCar = date.group(d3.time.day).reduceSum (function(d) { return d.car }),
      hoursGroupCar = hour.group(Math.floor).reduceSum (function(d) { return d.car }),

      datesGroupBus = date.group(d3.time.day).reduceSum (function(d) { return d.bus }),
      hoursGroupBus = hour.group(Math.floor).reduceSum (function(d) { return d.bus }),

      datesGroupPerson = date.group(d3.time.day).reduceSum (function(d) { return d.person }),
      hoursGroupPerson = hour.group(Math.floor).reduceSum (function(d) { return d.person }),

      camidx = xfilter.dimension(function(d) { return d.camidx; }),

      busesPerCamera = camidx.group().reduceSum (function(d) { 
                                                                      return d.bus;
                                                              }),
      carsPerCamera = camidx.group().reduceSum (function(d) { 
                                                                      return d.car;
                                                              }),
      personsPerCamera = camidx.group().reduceSum (function(d) { 
                                                                      return d.person;
                                                              }),

      latitude = xfilter.dimension(function(d) { return d.latitude; }),
      latitudes = latitude.group(function(d) { return Math.floor(d * 100.0) / 100.0; });
      longitude = xfilter.dimension(function(d) { return d.longitude; }),
      longitudes = longitude.group(function(d) { return Math.floor(d * 100.0) / 100.0; }),
      bus = xfilter.dimension(function(d) { return d.bus; }),

      car = xfilter.dimension(function(d) { return d.car; }),

      person = xfilter.dimension(function(d) { return d.person; });


  var charts = [

    barChart()
        .dimension(hour)
        .group(hoursGroupCar)
      .x(d3.scale.linear()
        .domain([0, 24])
        .rangeRound([0, 10 * 24]))
	  .filter([8, 14]),

    barChart()
        .dimension(date)
        .group(datesGroupCar)
        .round(d3.time.day.round)
      .x(d3.time.scale()
        // .domain([new Date(2015, 10, 1), new Date(2015, 11, 31)])
        .domain([new Date(2015, 11, 1), new Date(2016, 1, 3)])
        .rangeRound([0, 10 * 60]))
        // .filter([new Date(2015, 11, 1), new Date(2015, 11, 20)])
	  .filter([new Date(2015, 11, 5), new Date(2015, 11, 20)])

  ];

  // Given our array of charts, which we assume are in the same order as the
  // .chart elements in the DOM, bind the charts to the DOM and render them.
  // We also listen to the chart's brush events to update the display.
  var chart = d3.selectAll(".chart")
      .data(charts)
      .each(function(chart) { chart.on("brush", renderAll).on("brushend", renderAll); });

  renderAll();

  // Renders the specified chart or list.
  function render(method) {
    d3.select(this).call(method);
  }

  function renderHeat ()
  {
    window.heatmap.data = [];

    var points;
    if (window.heatType == "car")
    {
      charts[0].group(hoursGroupCar).yDomain([0, hoursGroupCar.top(1)[0].value]);//.y(d3.scale.linear().range([100, 0]).domain([0, hoursGroupCar.top(1)[0].value]));
      charts[1].group(datesGroupCar).yDomain([0, datesGroupCar.top(1)[0].value]);//.y(d3.scale.linear().range([100, 0]).domain([0, datesGroupCar.top(1)[0].value]));
      points = carsPerCamera.all();
    }
    else if (window.heatType == "bus")
    {
      charts[0].group(hoursGroupBus).yDomain([0, hoursGroupBus.top(1)[0].value]);//.y(d3.scale.linear().range([100, 0]).domain([0, hoursGroupBus.top(1)[0].value]));
      charts[1].group(datesGroupBus).yDomain([0, datesGroupBus.top(1)[0].value]);//.y(d3.scale.linear().range([100, 0]).domain([0, datesGroupBus.top(1)[0].value]));
      points = busesPerCamera.all();
    }
    else if (window.heatType == "person")
    {
      charts[0].group(hoursGroupPerson).yDomain([0, hoursGroupPerson.top(1)[0].value]);//.y(d3.scale.linear().range([100, 0]).domain([0, hoursGroupPerson.top(1)[0].value]));
      charts[1].group(datesGroupPerson).yDomain([0, datesGroupPerson.top(1)[0].value]);//.y(d3.scale.linear().range([100, 0]).domain([0, datesGroupPerson.top(1)[0].value]));
      points = personsPerCamera.all();
    }


    points.forEach (function (d, i) {

      var val = d.value;
      if (norm_req)
        val /= norm_den / 5.0;

      window.heatmap.pushData(window.cams[d.key].lat, window.cams[d.key].log, val);   
    });

    if(checkbox.checked == true){
      window.heatmap.redraw ();
    }
  }

  // Whenever the brush moves, re-rendering everything.
  function renderAll() {
    renderHeat();
    chart.each(render);
    d3.select("#active").text(formatNumber(all.value()));
    //
  }

  // Like d3.time.format, but faster.
  function parseDate(d) {
    return new Date(
        d.substring(0, 4),
        d.substring(5, 7) - 1,
        d.substring(8, 10),
        d.substring(11, 13),
        d.substring(14, 16),
        d.substring(17, 19));
  }

  window.filter = function(filters) {
    filters.forEach(function(d, i) { charts[i].filter(d); });
    renderAll();
  };

  window.reset = function(i) {
    charts[i].filter(null);
    renderAll();
  };

  function barChart() {
    if (!barChart.id) barChart.id = 0;

    var margin = {top: 10, right: 10, bottom: 20, left: 10},
        x,
        y = d3.scale.linear().range([100, 0]),
        id = barChart.id++,
        axis = d3.svg.axis().orient("bottom"),
        brush = d3.svg.brush(),
        brushDirty,
        dimension,
        group,
        round;

    function chart(div) {
      var width = x.range()[1],
          height = y.range()[0];

      y.domain([0, group.top(1)[0].value]);

      div.each(function() {
        var div = d3.select(this),
            g = div.select("g");

        // Create the skeletal chart.
        if (g.empty()) {
          div.select(".title").append("a")
              .attr("href", "javascript:reset(" + id + ")")
              .attr("class", "reset")
              .text("reset")
              .style("display", "none");


          g = div.append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
            .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          g.append("clipPath")
              .attr("id", "clip-" + id)
            .append("rect")
              .attr("width", width)
              .attr("height", height);

          g.selectAll(".bar")
              .data(["background", "foreground"])
            .enter().append("path")
              .attr("class", function(d) { return d + " bar"; })
              .datum(group.all());

          g.selectAll(".foreground.bar")
              .attr("clip-path", "url(#clip-" + id + ")");

          g.append("g")
              .attr("class", "axis")
              .attr("transform", "translate(0," + height + ")")
              .call(axis);

          // Initialize the brush component with pretty resize handles.
          var gBrush = g.append("g").attr("class", "brush").call(brush);
          gBrush.selectAll("rect").attr("height", height);
          gBrush.selectAll(".resize").append("path").attr("d", resizePath);
        }

        else {
            if (heatmap_switched)
            {
              g.selectAll(".bar").remove()
              g.selectAll(".bar")
                  .data(["background", "foreground"])
                .enter().append("path")
                  .attr("class", function(d) { return d + " bar"; })
                  .datum(group.all());

              g.selectAll(".foreground.bar")
                  .attr("clip-path", "url(#clip-" + id + ")");
              heatmap_switched = false;

              g.append("g")
                  .attr("class", "axis")
                  .attr("transform", "translate(0," + height + ")")
                  .call(axis);


              g.selectAll(".brush").remove()
              var gBrush = g.append("g").attr("class", "brush").call(brush);
              gBrush.selectAll("rect").attr("height", height);
              gBrush.selectAll(".resize").append("path").attr("d", resizePath);
            }
        }


        // Only redraw the brush if set externally.
        if (brushDirty) {
          brushDirty = false;
          g.selectAll(".brush").call(brush);
          div.select(".title a").style("display", brush.empty() ? "none" : null);
          if (brush.empty()) {
            g.selectAll("#clip-" + id + " rect")
                .attr("x", 0)
                .attr("width", width);
          } else {
            extent = brush.extent();
            //gStartTime = extent[0];
            //gEndTime = extent[1];
            //this is initialization
            // console.log("extent[0]: ");
            // console.log(extent[0]);
            // console.log("extent[0] type: "+typeof(extent[0]));
            // console.log("typeof(extent[0]) = typeof(new Date())"+ (typeof(extent[0]) == typeof(new Date())));//true
            //console.log("gStartTime: "+gStartTime);
            //console.log("gEndTime: "+gEndTime);
            g.selectAll("#clip-" + id + " rect")
                .attr("x", x(extent[0]))
                .attr("width", x(extent[1]) - x(extent[0]));
          }
        }

        g.selectAll(".bar").attr("d", barPath);
      });

      function barPath(groups) {
        var path = [],
            i = -1,
            n = groups.length,
            d;
        while (++i < n) {
          d = groups[i];
          path.push("M", x(d.key), ",", height, "V", y(d.value), "h9V", height);
        }
        return path.join("");
      }

      function resizePath(d) {
        var e = +(d == "e"),
            x = e ? 1 : -1,
            y = height / 3;
        return "M" + (.5 * x) + "," + y
            + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
            + "V" + (2 * y - 6)
            + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y)
            + "Z"
            + "M" + (2.5 * x) + "," + (y + 8)
            + "V" + (2 * y - 8)
            + "M" + (4.5 * x) + "," + (y + 8)
            + "V" + (2 * y - 8);
      }
    }

    brush.on("brushstart.chart", function() {
      var div = d3.select(this.parentNode.parentNode.parentNode);
      div.select(".title a").style("display", null);
    });

    brush.on("brush.chart", function() {
      var g = d3.select(this.parentNode),
          extent = brush.extent();
          if(id == 0){
            gStartTime.setHours (extent[0])
            gStartTime.setMinutes ((extent[0]-Math.floor(extent[0])) * 60)
            gStartTime.setSeconds ((extent[0]*100-Math.floor(extent[0]*100)) * 60)

            gEndTime.setHours (extent[1])
            gEndTime.setMinutes ((extent[1]-Math.floor(extent[1])) * 60)
            gEndTime.setSeconds ((extent[1]*100-Math.floor(extent[1]*100)) * 60)

          }else{
            gStartDate.setTime (extent[0].getTime())
            gEndDate.setTime (extent[1].getTime())
          }
      if (round) g.select(".brush")
          .call(brush.extent(extent = extent.map(round)))
        .selectAll(".resize")
          .style("display", null);
      g.select("#clip-" + id + " rect")
          .attr("x", x(extent[0]))
          .attr("width", x(extent[1]) - x(extent[0]));
      dimension.filterRange(extent);
      if (id == 0){
        norm_den = extent[1] - extent[0];
        if (norm_den == 0)
          norm_den = 24.0;
      }



  
    });

    brush.on("brushend.chart", function() {
      if (brush.empty()) {
        var div = d3.select(this.parentNode.parentNode.parentNode);
        div.select(".title a").style("display", "none");
        div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");
        dimension.filterAll();
		  if(id == 0){
			gStartTime = new Date('2015-12-05 00:00:00');
			gEndTime = new Date('2015-12-05 23:59:59');
		  }else{
			gStartDate = new Date('2015-12-01 00:00:00');
			gEndDate = new Date('2016-02-03 00:00:00');
		  }
      }
	    alert_type(false,"");
      time_updated_for_images = true;
      update_wordcloud ();
    });

    chart.margin = function(_) {
      if (!arguments.length) return margin;
      margin = _;
      return chart;
    };

    chart.x = function(_) {
      if (!arguments.length) return x;
      x = _;
      axis.scale(x);
      brush.x(x);
      return chart;
    };

    chart.y = function(_) {
      if (!arguments.length) return y;
      y = _;
      return chart;
    };

    chart.yDomain = function(_) {
      if (!arguments.length) return y;
      y.domain (_);
      return chart;
    };

    chart.dimension = function(_) {
      if (!arguments.length) return dimension;
      dimension = _;
      return chart;
    };

    chart.filter = function(_) {
      if (_) {
        brush.extent(_);
        dimension.filterRange(_);
      } else {
        brush.clear();
        dimension.filterAll();
      }
      brushDirty = true;
      return chart;
    };

    chart.group = function(_) {
      if (!arguments.length) return group;
      group = _;
      return chart;
    };

    chart.round = function(_) {
      if (!arguments.length) return round;
      round = _;
      return chart;
    };

    return d3.rebind(chart, brush, "on");
  }
});
// var baseMaps = {
//   "":
//   "":
// };

var baseMaps = {};
var overlayMaps ={
  "Cams":camLayer,
  "alerts":alertLayer
};
L.control.layers(baseMaps,overlayMaps).addTo(map);
