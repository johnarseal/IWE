from flask import session

def buildSQL(selectors,keys=("bug_severity","component","priority","product","resolution","transition","startswith[]","includes[]","createMin","createMax","resolveMin","resolveMax")):
    if selectors == None:
        return None
        
    conSql = " WHERE "
    hasKey = False
    hasTranStr = False
    for key in keys:
        if key in selectors:
            if selectors[key] == "All": 
                continue
            elif key == "startswith[]" and not hasTranStr:
                statusArr = selectors.getlist(key)
                conSql += "(transition LIKE '" + statusArr[0] + "%' "
                if len(statusArr) > 1:
                    for i in range(1,len(statusArr)):
                        conSql += "OR transition LIKE '" + statusArr[i] + "%' "
                conSql += ") AND "
            elif key == "includes[]" and not hasTranStr:
                statusArr = selectors.getlist(key)
                conSql += "(transition LIKE '%" + statusArr[0] + "%' "
                if len(statusArr) > 1:
                    for i in range(1,len(statusArr)):
                        conSql += "OR transition LIKE '%" + statusArr[i] + "%' "
                conSql += ") AND "
            elif key == "transition":
                conSql += "transition LIKE '" + selectors[key] + "%' AND "
                hasTranStr = True
            elif key == "createMin":
                conSql += "ts0 >= '" + selectors[key] + "' AND "
            elif key == "createMax":
                conSql += "ts0 <= '" + selectors[key] + "' AND "
            elif key == "resolveMin":
                conSql += "resolve_time >= '" + selectors[key] + "' AND "
            elif key == "resolveMax":
                conSql += "resolve_time <= '" + selectors[key] + "' AND "
            elif key == "priority":
                if selectors[key] == "Tagged":
                    conSql += "priority != '--' AND "
                else:
                    conSql += "priority = '" + selectors[key] + "' AND "
                
            # for temporary test
            elif key == "product":
                # how we distinguish between different teams
                if session["DS"] == "mozilla":
                    teamDiv = "component"
                else:
                    teamDiv = "product"
                conSql += teamDiv + " = '" + selectors[key] + "' AND "
            # temporary test ends
            
            elif key != "includes[]" and key != "startswith[]":
                conSql += key + " = '" + selectors[key] + "' AND "
            else:
                continue
            hasKey = True
            
    if hasKey:
        return conSql[:-4]
    else:
        return None