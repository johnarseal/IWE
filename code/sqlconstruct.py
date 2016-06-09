

def buildSQL(selectors,keys=("bug_severity","priority","product","resolution","transition","startswith[]","includes[]","createMin","createMax","resolveMin","resolveMax")):
    
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
            else:
                conSql += key + " = '" + selectors[key] + "' AND "
            hasKey = True
            
    if hasKey:
        return conSql[:-4]
    else:
        return None