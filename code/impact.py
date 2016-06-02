from settings import *
from flask import session
import time

def fetchResRate(selectors):
    
    sql = "SELECT resolution, COUNT(*) FROM iwe_statustran "
    conSql = " WHERE "
    hasKey = False
    keys = ("bug_severity","priority","product","resolution","minDate","maxDate","transition")
    
    for key in keys:
        if key in selectors:
            if selectors[key] == "All": 
                continue
            elif key == "minDate":
                conSql += "ts0 >= '" + selectors[key] + "' AND "
            elif key == "maxDate":
                conSql += "ts0 <= '" + selectors[key] + "' AND "
            elif key == "transition":
                conSql += "transition LIKE '" + selectors[key] + "%' AND "
            else:
                conSql += key + " = '" + selectors[key] + "' AND "
            hasKey = True
            
    if hasKey:
        sql += conSql[:-4]
    
    sql += " GROUP BY resolution"
            
    
    cursor = conDB(session["curDb"])
    cursor.execute(sql)
    rawD = list(cursor.fetchall())
    retD = []
    for row in rawD:
        if row[0] == "":
            retD.append(("NONE",row[1]))
        else:
            retD.append(row)
    
    
    return retD     
                   
def fetchResTime(selectors):

    sql = "SELECT UNIX_TIMESTAMP(resolve_time)-UNIX_TIMESTAMP(ts0) FROM iwe_statustran "
    conSql = " WHERE "
    hasKey = False
    keys = ("bug_severity","priority","product","resolution","minDate","maxDate","transition")
    
    for key in keys:
        if key in selectors:
            if selectors[key] == "All": 
                continue
            elif key == "minDate":
                conSql += "ts0 >= '" + selectors[key] + "' AND "
            elif key == "maxDate":
                conSql += "ts0 <= '" + selectors[key] + "' AND "
            elif key == "transition":
                conSql += "transition LIKE '" + selectors[key] + "%' AND "
            else:
                conSql += key + " = '" + selectors[key] + "' AND "
            hasKey = True
            
    if hasKey:
        sql += conSql[:-4]
    
    sql += " ORDER BY UNIX_TIMESTAMP(resolve_time)-UNIX_TIMESTAMP(ts0)"
    cursor = conDB(session["curDb"])
    cursor.execute(sql)    
    rawList = list(cursor.fetchall())
    resTimeList = [x[0] for x in rawList if x[0] != None]
    numTotal = len(rawList)
    numRes = len(resTimeList)
    retList = [[0,0]]
    timeQuant = [0.5,0.6,0.7,0.8,0.9]
    divisor = 3600 * 24
    for tq in timeQuant:
        curInd = int(numTotal * tq)
        if curInd > numRes:
            retList.append([round(float(resTimeList[numRes-1])/divisor,2),round(float(numRes) / numTotal,2)])
            break
        retList.append([round(float(resTimeList[curInd - 1])/divisor,2),tq])

    return retList    