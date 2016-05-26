// the ts of every node represents the 
// time gap between its parent and itself
function parseTree(d){
	console.log(d);
	var tagDict = {
	"NEW":"NEW","ASSIGNED":"ASS","UNCONFIRMED":"UNC","RESOLVED":"RES","VERIFIED":"VER","REOPENED":"REO"
	}
	//build a tree
	var nodeId = 0;
	var rr = {"child":{},"tag":"root",id:nodeId++};
	var mergeThres = 0.2;
	for (tranStr in d){
		var tranArr = tranStr.split(" ");
		var curNode = rr;
		var tranAttr = d[tranStr];
		var endInd = tranArr.length - 1;
		//iterate through a transition str
		for (var i in tranArr){
			var curTran = tranArr[i];
			// check whether to merge the node
			// find a node to merge
			ind = 0;
			tranStr = curTran;
			curTran = curTran + ind;
			if (i > 0) {
				while(curTran in curNode["child"]) {
					oldGap = curNode["child"][curTran]["ts"];
					newGap = tranAttr["ts"][i];
					gapDiff = Math.abs(oldGap-newGap);
					// if the gap difference is small, merge
					if(gapDiff <= oldGap * mergeThres){
						break;
					}
					else{
						ind++;
						curTran = tranStr + ind;
					}
				}
			}
			// merge or not
			if(curTran in curNode["child"]){
				curNode = curNode["child"][curTran];
				// average the ts
				totalNum = curNode["num"] + tranAttr["num"]
				curNode["ts"] = (curNode["num"] * curNode["ts"] + tranAttr["num"] * tranAttr["ts"][i]) / totalNum;
				curNode["meanTS"] = (curNode["num"] * curNode["meanTS"] + tranAttr["num"] * tranAttr["meants"][i]) / totalNum;
				curNode["num"] = totalNum;
			}
			else{		// a new node
				curNode["child"][curTran]={"child":{},"tag":tagDict[tranStr],"id":nodeId++,"parentId":curNode.id,"statusStr":tranStr};
				curNode = curNode["child"][curTran];
				curNode["num"] = tranAttr["num"];
				curNode["ts"] = tranAttr["ts"][i];
				curNode["meanTS"] = tranAttr["meants"][i];
			}
			// if it is an end, add a node
			if(i == endInd){
				curNode["child"]["END"] = {"num":tranAttr["num"],"ts":tranAttr["ts"][i]};
			}
		}
	}
	return rr;
}


// find the number of child node of each node
function searchWidth(node){
	var hasChild = false;
	for(childStr in node["child"]){
		if (childStr != "END"){
			hasChild = true;
			break;
		}
	}
	if(!hasChild){
		node["maxWidth"] = 1;
		return 1;
	}
	maxWidth = 0;
	for(childStr in node["child"]){
		if (childStr != "END"){
			maxWidth += searchWidth(node["child"][childStr]);
		}
	}
	node["maxWidth"] = maxWidth;
	return maxWidth;
}


//build the scale of the work flow chart
//including the cy of each node
function buildScale(svgAttr,r){
		
	// a series of rate
	var innerGapRate = 0.5;
	var widthLineNodeRate = 0.8;
	var minLineWidth = 2;
	var maxLineWidth = 20;
	var minLineLen;
	var maxBorder = 5;
	var minBorder = 2;
	
	// to find the maximum and minimal value in the tree
	// in order to build the scale
	var maxTS = maxNUM = 0;
	var minTS = minNUM = 999999999;
	var tDepth = 0;
	var nodeIndArr = new Array();
	nodeIndArr[0] = {"child":[],"id":0,"totalTS":999999999};
	function traverseTree(node,lTs,depth){
		if(node.tag != "root"){
			if(node.ts != 0){
				minTS = Math.min(node.ts,minTS);
			}
			if(node.num != 0){
				minNUM = Math.min(minNUM,node.num);
			}
			tDepth = Math.max(tDepth,depth);
			lTs += node.ts;
			node.totalTS = lTs;
			nodeIndArr[node.id] = {"child":[],"totalTS":lTs,"parentId":node.parentId,"id":node.id,"num":node.num,"statusStr":node.statusStr,"meanTS":node.meanTS};
			if(node.parentId==0){
				nodeIndArr[0].child.push(node.id);
			}
			for (childStr in node.child){
				if(childStr != "END"){
					nodeIndArr[node.id]["child"].push(node.child[childStr].id);
				}
			}			
			maxTS = Math.max(maxTS,lTs);
			maxNUM = Math.max(maxNUM,node.num);	
		}
		var thisHeight = 0;
		for (childStr in node.child){
			if(childStr != "END"){
				var curHeight = traverseTree(node.child[childStr],lTs,depth+1);
				thisHeight = Math.max(thisHeight,curHeight);
			}
		}
		node.height = thisHeight;
		nodeIndArr[node.id].height = node.height;
		return thisHeight + 1;
	}
	traverseTree(r,0,0);
	function tsSort(a,b){
		if(a.totalTS == b.totalTS){
			return a.id - b.id;
		}
		return a.totalTS - b.totalTS;
	}
	// deep copy
	var nodeArr = nodeIndArr.slice(0);
	nodeArr.sort(tsSort);
	
	// set the maxR according to the width
	maxR = (svgAttr.width - svgAttr.paddingH * 2) / ((innerGapRate + 2) * r.maxWidth - innerGapRate);
	// if the maxR is too big, reduce it.
	if(tDepth * maxR * 2 > (svgAttr.height - svgAttr.paddingV * 2)){
		maxR = (svgAttr.height - svgAttr.paddingV * 2) * 0.8 / (tDepth * 2);
	}
	maxR = Math.min(maxR,svgAttr.height / 8);
	minR = maxR * 0.4;
	minLineLen = minR * 0.5;
	//scale of the radius	
	crScale = d3.scale.linear()
		.domain([minNUM, maxNUM])
        .range([minR, maxR]);
		
	borderScale = d3.scale.linear()
		.domain([minR, maxR])
        .range([minBorder, maxBorder]);
	
	//scale of the width of edge in the tree
	maxLineWidth = Math.min(maxR * widthLineNodeRate,maxLineWidth);
	edgeWidthScale = d3.scale.linear()
		.domain([minNUM, maxNUM])
        .range([minLineWidth, maxLineWidth]);
	
	// directly find the cy of each node
	var lastTS = 0;
	var topCY = svgAttr.paddingH + maxR;
	var lastCY = topCY;
	var bottomTS = nodeArr[nodeArr.length - 2].totalTS;
	var bottomCY = svgAttr.height - svgAttr.paddingH - crScale(minR);
	var nodeNUM = nodeArr.length - 1;
	for (var i = 0; i < nodeNUM; i++){
		var idealCY = lastCY + ((nodeArr[i].totalTS - lastTS) / (bottomTS - lastTS)) * (bottomCY - lastCY);
		var minCY = 0;
		if(nodeArr[i].parentId != 0){
			minCY = nodeIndArr[nodeArr[i].parentId].cy + crScale(nodeIndArr[nodeArr[i].parentId].num) + minLineLen + crScale(nodeArr[i].num);		
		}
		var bottomMargin = nodeArr[i].height * (maxR + minR);
		var maxCY = svgAttr.height - svgAttr.paddingH - bottomMargin - crScale(nodeArr[i].num);
		lastCY = Math.max(idealCY,minCY);
		lastCY = Math.min(lastCY,maxCY);
		nodeIndArr[nodeArr[i].id].cy = lastCY;
		lastTS = nodeArr[i].totalTS;
	}
		
	// prepare the data for drawing the axis
	var axisD = new Array();
	var scaleInd = [0,parseInt(nodeNUM / 2), nodeNUM-1];
	for (var i in scaleInd){
		var nodeInfo = nodeIndArr[nodeArr[scaleInd[i]].id];
		var oneScale = {"scale":nodeInfo.cy,"text":nodeInfo.totalTS.toFixed(1)};
		axisD.push(oneScale);
	}
	
	var trScale = {"crScale":crScale,"edgeWidthScale":edgeWidthScale,"nodeIndArr":nodeIndArr,"axisD":axisD,"borderScale":borderScale};
	return trScale;
}


//draw a single node
function cacheNode(node,cx,cy,cr,svg,svgAttr,nodeCache){
	nodeCache.push({cx:cx,cy:cy,cr:cr,tag:node.tag,id:node.id});
}
function drawNodes(svg,svgAttr,nodeCache,scale){
	for(var i in nodeCache){
		var g = svg.append("g").attr("class","nodeTrigger").attr("id","i"+nodeCache[i].id+"-cirg");
		g.append("circle").attr("cx",nodeCache[i].cx)
						.attr("cy",nodeCache[i].cy)
						.attr("r",nodeCache[i].cr)
						.attr("fill",svgAttr.colors.node[nodeCache[i].tag])
						.attr("stroke",svgAttr.colors.nodeBorder)
						.attr("stroke-width",scale.borderScale(nodeCache[i].cr))
						.attr("class"," nodeCircle")
						.attr("id",nodeCache[i].id+"-cir")
						.style("title","sb");
		g.append("text").attr("x",nodeCache[i].cx)
						.attr("y",nodeCache[i].cy)
						.attr("text-anchor","middle")
						.attr("fill",svgAttr.colors.text)
						.attr("dy",".25em")
						.text(nodeCache[i].tag)
						.attr("id",nodeCache[i].id+"-cirtxt")
						.style("cursor","default")
						.style("font-size","12px");

	}
}

// draw the upper edge
function drawEdge(lEdgeX,lEdgeY,node,cx,cy,cr,edgeWidth,svg,svgAttr){
	//draw the edge
	if(lEdgeX != 0 && lEdgeY != 0){
		if(Math.abs(lEdgeX - cx) < 1){
			svg.append("line").attr("x1",lEdgeX)
						.attr("y1",lEdgeY)
						.attr("x2",cx)
						.attr("y2",cy - cr)
						.attr("id",node.id+"-upline")
						.style("stroke",svgAttr.colors.edge)
						.style("stroke-width",edgeWidth);			
		}
		else{
			var curRate = 0.4;
			var distY = cy - cr - lEdgeY;
			var turningY = lEdgeY + distY * curRate;
			var dParam = "M "+ lEdgeX + "," + (lEdgeY - edgeWidth * 0.5) + " Q " + cx + "," + lEdgeY + " " + cx + ","+ turningY;
			svg.append("path").attr("d",dParam)
							.attr("fill","none")
							.attr("id",node.id+"-uppath")
							.style("stroke",svgAttr.colors.edge)
							.style("stroke-width",edgeWidth);
			svg.append("line").attr("x1",cx)
							.attr("y1",turningY)
							.attr("x2",cx)
							.attr("y2",cy - cr)
							.attr("id",node.id+"-upline")
							.style("stroke",svgAttr.colors.edge)
							.style("stroke-width",edgeWidth);	
		}
	}
}


//draw the whole tree
function drawTree(lEdgeX,lEdgeY,node,left,right,treeScale,svg,svgAttr,nodeCache){
		
	// compute the cx,cy,cr first
	var cx,cy,cr;
	if(node.tag != 'root'){
		cx = (left + right) / 2;
		cy = treeScale.nodeIndArr[node.id].cy;
		cr = treeScale.crScale(node.num);
		//draw the upper edge
		var edgeWidth = treeScale.edgeWidthScale(node.num);
		drawEdge(lEdgeX,lEdgeY,node,cx,cy,cr,edgeWidth,svg,svgAttr);
	}
	else{
		//var thisEdge = lastEdge;
		cx = cy = 0;
	}

	//sort the child, draw the biggest first
	var totalChildNum = 0;
	function tranSort(a,b){
		return b.num - a.num;
	}
	// both sort and find the min ts among the children
	var tranSortArr = new Array();
	var minChildCY = 9999999;
	var minChildId;
	var endNum = 0;
	for(var childStr in node.child){
		if(childStr != 'END'){
			tranSortArr.push({"name":childStr,"num":node.child[childStr].num});
			totalChildNum += node.child[childStr].num;
			if(treeScale.nodeIndArr[node.child[childStr].id].cy < minChildCY){
				minChildId = node.child[childStr].id;
				minChildCY = treeScale.nodeIndArr[node.child[childStr].id].cy;
			}
		}
		else{
			endNum = node.child[childStr].num;
		}
	}
	var edgeX = 0;
	var edgeY = 0;
	// draw a part of the bottom edge
	if (totalChildNum != 0 && node.tag != "root"){
		edgeX = cx;
		edgeY = cy + cr + (minChildCY - treeScale.crScale(treeScale.nodeIndArr[minChildId].num) - cy - cr) * 0.2;
		
		svg.append("line").attr("x1",edgeX)
						.attr("y1",cy + cr)
						.attr("x2",edgeX)
						.attr("y2",edgeY)
						.attr("id",node.id+"-btmedge")
						.style("stroke",svgAttr.colors.edge)
						.style("stroke-width",treeScale.edgeWidthScale(node.num - endNum));
	}
	tranSortArr.sort(tranSort);
	
	//iterate through the children
	var curLeft = left;
	var curDist = right-left;
	for(var ind in tranSortArr){
		childStr = tranSortArr[ind].name;
		var distRate = ((node.child[childStr].maxWidth / node.maxWidth) + (node.child[childStr].num / totalChildNum)) / 2;
		var dist = curDist * distRate;
		//draw the tree of son
		drawTree(edgeX,edgeY,node.child[childStr],curLeft,curLeft+dist,treeScale,svg,svgAttr,nodeCache);
		curLeft = curLeft+dist;
	}
	// draw the node
	if(node.tag != 'root'){
		cacheNode(node,cx,cy,cr,svg,svgAttr,nodeCache);
	}
}


//draw the axis of the workflow view
function drawAxis(d,svg,startX,startY,title=false){
var scaleSize = 8;
var g = svg.append("g")
	  .attr("class","axis")
	  .attr("transform","translate("+startX+","+startY+")");	
	for(var i in d){
		g.append("line")
		.attr("y1",d[i].scale)
		.attr("x2",scaleSize)
		.attr("y2",d[i].scale);
		g.append("text")
		.attr("y",d[i].scale)
		.attr("x",scaleSize+2)
		.attr("dy",".4em")
		.style("text-anchor", "left")
		.text(d[i].text);
	}
	g.append("line")
		.attr("x1",0)
		.attr("y1",d[0].scale)
		.attr("x2",0)
		.attr("y2",d[d.length-1].scale);
	//draw the title of the axis
	if(title != false){
		g.append("text")
			.attr("x",-5)
			.attr("y",d[0].scale-5)
			.style("font-size","14px")
			.text(title);
	}
}
function lightColor(colorInt){
	var colorArr = new Array();
	for(var i = 0; i < 3; i++){
		colorArr[i] = colorInt % 256;
		colorInt = parseInt(colorInt / 256);
	}
	var retVal = 0;
	var tmp;
	for(var i = 2; i >= 0; i--){
		if(colorArr[i]+25 > 255){
			tmp = 255;
		}
		else{
			tmp = colorArr[i]+25;
		}
		retVal = retVal * 256 + tmp;
	}
	return retVal;
}

function drawToolTip(svg,svgAttr,nodeId,scale){
	var boxWidth = 120;
	var boxHeight = 75;
	var tipG = svg.append("g")
				.attr("id","i"+nodeId+"-tooltip");
	var tcx = parseInt($("#"+nodeId+"-cir").attr("cx"))+parseInt($("#"+nodeId+"-cir").attr("r"));
	var tcy = parseInt($("#"+nodeId+"-cir").attr("cy"))-20;
	if(tcx + boxWidth > svgAttr.width){
		tcx = parseInt($("#"+nodeId+"-cir").attr("cx")) - parseInt($("#"+nodeId+"-cir").attr("r")) - boxWidth;
	}
	if(tcy + boxHeight > svgAttr.height){
		tcy -= (boxHeight - 20);
	}
	tipG.append("rect").attr("width",boxWidth)
					.attr("height",boxHeight)
					.attr("x",tcx)
					.attr("y",tcy)
					.attr("fill-opacity",0.35)
					.attr("fill","rgb(121, 205, 205)");
	var txtBox = tipG.append("text")
					.attr("x",tcx+5)
					.attr("y",tcy+20);

	txtBox.append("tspan")
		.attr("x",tcx+5)
		.style("font-weight","bold")
		.text("num ");
	txtBox.append("tspan")
		.text(scale.nodeIndArr[nodeId].num);
	txtBox.append("tspan")
		.attr("x",tcx+5)
		.attr("dy",15)
		.style("font-weight","bold")
		.text("Time(week)")
	txtBox.append("tspan")
		.attr("x",tcx+5)
		.attr("dy",15)
		.text("  Median "+scale.nodeIndArr[nodeId].totalTS.toFixed(2));
	txtBox.append("tspan")
		.attr("x",tcx+5)
		.attr("dy",15)
		.text("  Mean   "+scale.nodeIndArr[nodeId].meanTS.toFixed(2));	
}
function drawWorkFlow(d,svgAttr,svgId){
	var svg = d3.select(svgId)  
    .append("svg")     
    .attr("width", svgAttr.width)
    .attr("height", svgAttr.height);
	
	selectors.tranStr = new Array();
	
	var r = parseTree(d);
	searchWidth(r);
	
	var scale = buildScale(svgAttr,r);
	
	var nodeCache = new Array();
	drawTree(0,0,r,svgAttr.paddingH + svgAttr.axisWidth,svgAttr.width - svgAttr.paddingH,scale,svg,svgAttr,nodeCache);
	drawNodes(svg,svgAttr,nodeCache,scale);
	
	drawAxis(scale.axisD,svg,svgAttr.axisWidth,0,"Time(week)");
	
	var activeArr = new Array();
	var lastSelNodeId;
	function recoverChildren(){
		while(activeArr.length != 0){
			var id = activeArr.shift();
			$("#"+id+"-cir")
				.attr("stroke",svgAttr.colors.nodeBorder);
			$("#"+id+"-cir")
				.css("cursor","default");
			$("#"+id+"-cirtxt")
				.css("cursor","default");
		}	
	}
	function activeChildren(nodeId){
		//turn its child to active node
		for(var i in scale.nodeIndArr[nodeId].child){
			var childId = scale.nodeIndArr[nodeId].child[i];
			activeArr.push(childId);
			$("#"+childId+"-cir")
				.attr("stroke",svgAttr.colors.activeBorder);
			$("#"+childId+"-cir")
				.css("cursor","pointer");
			$("#"+childId+"-cirtxt")
				.css("cursor","pointer");
			}
	}
	function recoverTree(){
		for(var id = 1; id < scale.nodeIndArr.length; id++){
			$("#"+id+"-cir")
				.attr("stroke",svgAttr.colors.nodeBorder);
			$("#"+id+"-cir")
				.css("cursor","default");
			$("#"+id+"-cirtxt")
				.css("cursor","default");
			$("#"+id+"-btmedge")
				.css("stroke",svgAttr.colors.edge);
			$("#"+id+"-uppath")
				.css("stroke",svgAttr.colors.edge);
			$("#"+id+"-upline")
				.css("stroke",svgAttr.colors.edge);				
		}
		activeArr = new Array();
	}
	$("#wf-sel").unbind();
	$("#wf-cancel").unbind();
	$(".nodeTrigger").unbind();
	
	$(".nodeTrigger").mousedown(function(event){
		if(event.button==0){
			var nodeId = parseInt($(this).attr("id").substr(1));
			//console.log($(this).attr("id"));
			if($.inArray(nodeId, activeArr) < 0){
				return;
			}
			selectors.tranStr.push(scale.nodeIndArr[nodeId].statusStr);
			//turn the active node color back to normal
			recoverChildren();
			//turn this node to the selected color
			lastSelNodeId = nodeId;
			$("#"+lastSelNodeId+"-cir")
				.attr("stroke",svgAttr.colors.selectedBorder);
			if(scale.nodeIndArr[nodeId].parentId != 0){
				$("#"+scale.nodeIndArr[nodeId].parentId+"-btmedge")
					.css("stroke",svgAttr.colors.selectedBorder);
				$("#"+nodeId+"-uppath")
					.css("stroke",svgAttr.colors.selectedBorder);
				$("#"+nodeId+"-upline")
					.css("stroke",svgAttr.colors.selectedBorder);
			}
			//turn its child to activate node
			activeChildren(lastSelNodeId);
		}
		else if(event.button==2 && lastSelNodeId == parseInt($(this).attr("id").substr(1))){
			//turn the active node color back to normal
			recoverChildren();
			//turn this node to the selected color
			var nodeId = parseInt($(this).attr("id").substr(1));
			selectors.tranStr.pop();
			lastSelNodeId = scale.nodeIndArr[nodeId].parentId;
			if(lastSelNodeId != 0){
				$("#"+lastSelNodeId+"-btmedge")
					.css("stroke",svgAttr.colors.edge);
				$("#"+nodeId+"-uppath")
					.css("stroke",svgAttr.colors.edge);
				$("#"+nodeId+"-upline")
					.css("stroke",svgAttr.colors.edge);
			}
			//turn its child to active node
			activeChildren(lastSelNodeId);
		}
	});
	
	$("#wf-sel").click(function(){
		activeChildren(0);
	});
	$("#wf-cancel").click(function(){
		recoverTree();
	});
	var oldColor = null;
	$(".nodeTrigger").mouseenter(function(){
		if(oldColor == null){
			var nodeId = parseInt($(this).attr("id").substr(1));
			oldColor = $("#"+nodeId+"-cir").attr("fill");
			var colorInt = parseInt($("#"+nodeId+"-cir").attr("fill").substr(1),16);
			var newColor = lightColor(colorInt).toString(16);
			$("#"+nodeId+"-cir").attr("fill","#"+newColor);
			$("#"+nodeId+"-cirtxt").attr("fill","#BBB");
			drawToolTip(svg,svgAttr,nodeId,scale)
		}
	});
	$(".nodeTrigger").mouseleave(function(){
		var nodeId = parseInt($(this).attr("id").substr(1));
		$("#"+nodeId+"-cir").attr("fill",oldColor);
		$("#"+nodeId+"-cirtxt").attr("fill","#000");
		oldColor = null;
		$("#i"+nodeId+"-tooltip").remove();
	});
}

function initWorkflowEvent(){
	
	$("#wfRedraw").click(function(){
		$.get(
			"/api/workflow",
			selectors,
			function(data){
				$("#svg-wrap").html("");
				drawWorkFlow(data,svgWorkFlowAttr,"#svg-wrap");
			},
			"json"
		);
	});
}

