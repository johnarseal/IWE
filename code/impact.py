from settings import *
from flask import session
import time

def fetchResRate(selectors):
    
    sql = "SELECT resolution, COUNT(*) FROM iwe_statustran "
    conSql = " WHERE "
    hasKey = False
    keys = ("bug_severity","priority","product_id","resolution","minDate","maxDate","transition")
    
    for key in keys:
        if key in selectors:
            if selectors[key] == "All" or (key == "product_id" and selectors[key] == '-1'): 
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
            
            
            