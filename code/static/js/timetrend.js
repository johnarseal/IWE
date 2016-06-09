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
			type: 'datetime'
		},
		yAxis:[
			{id:"workflow"},
			{id:"resRate",min:0,max:1},
			{id:"resTime"}
		],
		legend:{
			enabled:true,
			margin:0
		},
		tooltip:{
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
function initTimeTrendEvent(){
	var ttAttr = {
		workflowTT:	{url:"/api/timetrend/wf",yAxis:"workflow",dpAppro:"sum"},
		resrateTT:	{url:"/api/timetrend/resrate",yAxis:"resRate",dpAppro:"average"},
		restimeTT:	{url:"/api/timetrend/restime",yAxis:"resTime",dpAppro:"average"}
	};
	
	$(".timeTrendBtn").click(function(){
		var ttId = $(this).attr("id");
		initSelTran();
		var legend = parseSelectors(selectors);
		$.get(
			ttAttr[ttId].url,
			selectors,
			function(data){
				console.log(ttAttr[ttId]);
				var chart = $("#timeTrendWrap").highcharts();
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
}