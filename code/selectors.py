from settings import *
from flask import session
import time

def selectorsInit(db):
    
    cursor = conDB(db)
    if cursor == None:
        return None
    
    # fetch product
    sql = """
        SELECT `name`,`id` FROM products ORDER BY `name`;
    """
    cursor.execute(sql)
    products = cursor.fetchall()
    productInfo = [{"name":"All","id":-1}]
    productInfo.extend([{"name":x[0],"id":x[1]} for x in products])
    
    # fetch resolution
    sql = """
        SELECT DISTINCT(resolution) FROM iwe_statustran;
    """
    cursor.execute(sql)
    resolution = cursor.fetchall()
    resInfo = ["All",]
    resInfo.extend([x[0] for x in resolution if x[0] != ""])
    
    # fetch severity
    sql = """
        SELECT DISTINCT(bug_severity) FROM iwe_statustran;
    """
    cursor.execute(sql)
    severity = cursor.fetchall()
    sevInfo = ["All",]
    sevInfo.extend([x[0] for x in severity if x[0] != ""])
    
    # fetch priority
    sql = """
        SELECT DISTINCT(priority) FROM iwe_statustran;
    """
    cursor.execute(sql)
    priority = cursor.fetchall()
    priorInfo = ["All",]
    priorInfo.extend([x[0] for x in priority if x[0] != ""])
    
    # total number of bugs over time
    sql = """
        SELECT DATE_FORMAT(ts0,"%Y-%m"),COUNT(*) FROM iwe_statustran GROUP BY DATE_FORMAT(ts0,"%Y-%m");
    """
    cursor.execute(sql)
    totalNum = cursor.fetchall()
    totalInfo = [[time.mktime(time.strptime(x[0]+"-01",'%Y-%m-%d')) * 1000,x[1]] for x in totalNum]
    
    return {"products":productInfo, "resolutions":resInfo, "severities":sevInfo, "priorities":priorInfo, "totalNum":totalInfo}


# get the data from selectors, first try session, if not cached then try database    
def getSelectors(db):
        
    if db not in session:
        session[db] = {}
    
    if "selInfo" in session[db]:
        print "cahce hit"
        return session[db]["selInfo"]
    else:
        print "cache miss"
        selInfo = selectorsInit(db)
        session[db]["selInfo"] = selInfo
        return selInfo
        
        
def fetchTimeTotal(selectors):
    
    sql = """
        SELECT DATE_FORMAT(ts0,"%Y-%m"),COUNT(*) FROM iwe_statustran
    """
    conSql = " WHERE "
    hasKey = False
    keys = ("bug_severity","priority","product_id","resolution")
    for key in keys:
        if key in selectors:
            if selectors[key] == "All" or (key == "product_id" and selectors[key] == '-1'): 
                continue
            hasKey = True
            conSql += key + " = '" + selectors[key] + "' AND "
    
    if hasKey:
        sql += conSql[:-4]
    
    sql += """ 
        GROUP BY DATE_FORMAT(ts0,"%Y-%m")
    """
    
    cursor = conDB(session["curDb"])
    cursor.execute(sql)
    totalNum = cursor.fetchall()
    totalData = [[time.mktime(time.strptime(x[0]+"-01",'%Y-%m-%d')) * 1000,x[1]] for x in totalNum]
    
    return totalData
        
    
    
    
    