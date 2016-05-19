
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
	
	selectors = {product_id:-1,resolution:"All",bug_severity:"All",priority:"All"};
	
	$(".sel-option").change(function(){
		$("#totalTimeRefresh").show();
		if($(this).attr("id")=="sel-product"){
			selectors.product_id = parseInt($(this).find("option:selected").attr("id"));
		}
		else{
			var field = $(this).attr("id").split("-")[1];
			selectors[field] = $(this).find("option:selected").text();
		}
	});
	
	
	$("#totalTimeRefresh").click(function(){
		redrawTimeTotal();
		$("#totalTimeRefresh").hide();
	});
}

function redrawTimeTotal(){
	$.get(
		"/timetotal",
		selectors,
		function(data){
			var chart = $("#timeTotalChart").highcharts();
			chart.series[0].setData(data);
		},
		"json"
	);
}




