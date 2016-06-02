
//selector of total bug number over time
function initTimeTotal(chartId,data){
        // Create the chart
		var navHeight = parseInt($(chartId).css("height")) * 0.25;
        $(chartId).highcharts('StockChart', {
			
            rangeSelector : {
				enabled:true,
				buttons:[],
				inputBoxWidth:55,
				inputDateFormat: "%b,%Y",
				inputEditDateFormat:"%Y-%m"
            },
			credits: {
					  enabled:false
			},
            series : [{
                name : 'created bugs',
                data: data
            }],
			navigator:	{
				height:navHeight,
				margin:5
			},
			xAxis:{
				type: 'datetime'
			},
			tooltip:{
				xDateFormat:"%b,%Y"
			}
        });
		//$(chartId + " .highcharts-input-group").attr("visibility","visible");
}

function initSelectorEvent(){
		
	$(".sel-option").change(function(){
		$("#totalTimeRefresh").show();
		var field = $(this).attr("id").split("-")[1];
		if($(this).find("option:selected").text() != "All"){
			selectors[field] = $(this).find("option:selected").text();
		}
		else{
			delete selectors[field];
		}
	});
	
	$("#totalTimeRefresh").click(function(){
		redrawTimeTotal();
		$("#totalTimeRefresh").hide();
	});
	
	$(".highcharts-range-selector").change(function(){
		var key = $(this).attr("name") + "Date";
		var dateStr;
		if($(this).attr("name") == "min"){
			dateStr = "-01"
		}
		else{
			dateStr = "-31"
		}
		selectors[key] = $(this).val() + dateStr;
	});
	$("#timeTotalChart").mouseup(function(){
		var minDate = $("input[class='highcharts-range-selector'][name='min']").val() + "-01";
		var maxDate = $("input[class='highcharts-range-selector'][name='max']").val() + "-31";
		selectors.minDate = minDate;
		selectors.maxDate = maxDate;
	});
}

function redrawTimeTotal(){
	$.get(
		"/api/timetotal",
		selectors,
		function(data){
			var chart = $("#timeTotalChart").highcharts();
			chart.series[0].setData(data);
		},
		"json"
	);
}




