function parseSelectors(selectors){
	var retStr = "";
	for(var s in selectors){
		if(s != "tranStr"){
			retStr += selectors[s] + " ";
		}
	}
	if(retStr == ""){
		retStr = "All";
	}
	return retStr;
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