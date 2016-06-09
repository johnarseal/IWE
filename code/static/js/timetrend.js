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
		}
    });
}
function initSelTran(){
	var transition = "";
	for(i in selectors.tranStr){
		transition += selectors.tranStr[i] + " "
	}
	selectors.transition = transition.substring(0,transition.length-1);
	if(selectors.transition == ""){
		delete selectors.transition;
	}
}
function initTimeTrendEvent(){
	var ttAttr = {
		workflowTT:	{url:"/api/timetrend/wf",yAxis:"workflow",dpAppro:"sum"},
		resrateTT:	{url:"/api/timetrend/resrate",yAxis:"resRate",dpAppro:"average"},
		restimeTT:	{url:"/api/timetrend/restime",yAxis:"resTime",dpAppro:"average"}
	};
	
	$(".timeTrendBtn").click(function(){
		var ttId = $(this).attr("id");
		console.log(ttAttr[ttId].yAxis);
		initSelTran();
		$.get(
			ttAttr[ttId].url,
			selectors,
			function(data){
				console.log(ttAttr[ttId]);
				var chart = $("#timeTrendWrap").highcharts();
				chart.addSeries(
				{data:data,yAxis:ttAttr[ttId].yAxis,dataGrouping:{approximation:ttAttr[ttId].dpAppro}}
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