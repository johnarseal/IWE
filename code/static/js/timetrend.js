function timeTrendInit(data){
    $("#timeTrendWrap").highcharts('StockChart', {
		credits: {
				enabled:false
		},
        series : [
			{
                name : 'total',
                data: data,
				yAxis:"workflow",
				dataGrouping:{approximation:"sum"}
            }
		],
		navigator:	{
			enabled:false
		},
		xAxis:{
			type: 'datetime',
			title:{text:"Time"},
            dateTimeLabelFormats: {
                day: '%Y-%m-%d',
                month: '%Y-%m',
                year: '%Y'
            }
		},
		yAxis:[
			{id:"workflow",labels:{align:"right",x:30},title:{text:"number of issues",offset:40}},
			{id:"resRate",min:0,max:1,title:{text:"proportion of issues"},opposite:false},
			{id:"resTime"}
		],
		legend:{
			enabled:true,
			margin:0
		},
		tooltip:{
			dateTimeLabelFormats: {
				millisecond: '%b %d, %Y %H:%M:%S.%L',
				second: '%b %d, %Y %H:%M:%S',
				minute: '%b %d, %Y %H:%M',
				hour: '%b %d, %Y %H:%M',
				day: '%b %d, %Y',
				week: '%b %d, %Y',
				month: '%b %Y',
				year: '%Y'
            },
			pointFormatter:function(){
                var s = "<b>" + this.series.name + " </b>";
				var ind = this.series.name.indexOf(":")
				var yAxis = this.series.name.substr(0,ind);
				if(yAxis == "resRate"){
					s += (this.y * 100).toFixed(2) + "% fixed bugs";
				}
				else if(yAxis == "resTime"){
					s += "90% bugs fixed in " + this.y.toFixed(0) + " days";
				}
				else{
					s += this.y;
				}
				s += "<br/>"
				return s;
			}
		}
    });
}

function replaceNull(data){
	var lastDate = data[0][0];
	var rtData = [data[0],];
	
	// max interval is a day
	var oneDayMiniSec = 24*3600000;
	
	for(i in data){
		if(i == 0){
			continue;
		}
		curDate = data[i][0];
		while(curDate - lastDate > oneDayMiniSec){
			lastDate += oneDayMiniSec;
			rtData.push([lastDate,0]);
		}
		rtData.push(data[i]);
		lastDate = curDate;
	} 
	return rtData;
}
function initTimeTrendEvent(){
	var ttAttr = {
		workflowTT:	{url:"/iwe/api/timetrend/wf",yAxis:"workflow",dpAppro:"sum"},
		resrateTT:	{url:"/iwe/api/timetrend/resrate",yAxis:"resRate",dpAppro:"average"},
		restimeTT:	{url:"/iwe/api/timetrend/restime",yAxis:"resTime",dpAppro:"average"}
	};
	
	$(".timeTrendBtn").click(function(){
		var ttId = $(this).attr("id");
		initSelTran();
		var legend = parseSelectors(selectors);
		$.get(
			ttAttr[ttId].url,
			selectors,
			function(data){
				//console.log(ttAttr[ttId]);
				var chart = $("#timeTrendWrap").highcharts();
				data = replaceNull(data);
				chart.addSeries(
				{name:ttAttr[ttId].yAxis + ": " + legend,data:data,yAxis:ttAttr[ttId].yAxis,dataGrouping:{approximation:ttAttr[ttId].dpAppro}}
				);
			},
			"json"		
		);
	});
	$("#timetrend-clear").click(function(){
		var chart = $("#timeTrendWrap").highcharts();           
		
		var seriesLen = chart.series.length;
		while(seriesLen--){
			chart.series[seriesLen].remove();
		}
	
		chart.redraw();
	});
	$("#tmtprpt").click(function(){
        alert("You have switched to reprot time.");
		$.post("/iwe/api/tmtp/rpt");
	});
	$("#tmtprsl").click(function(){
        alert("You have switched to resolution time.");
		$.post("/iwe/api/tmtp/rslt");
	});
}
