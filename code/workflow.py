from settings import *
import time
import numpy as np
import pandas as pd
from flask import session
from sqlconstruct import *

sqlTS = """
UNIX_TIMESTAMP(ts1) - UNIX_TIMESTAMP(ts0),
UNIX_TIMESTAMP(ts2) - UNIX_TIMESTAMP(ts1),
UNIX_TIMESTAMP(ts3) - UNIX_TIMESTAMP(ts2),
UNIX_TIMESTAMP(ts4)- UNIX_TIMESTAMP(ts3),
UNIX_TIMESTAMP(ts5)- UNIX_TIMESTAMP(ts4) 
"""
def processWFdata(rawD):
    data = list(rawD)
    
    # init pandas dataframe
    df = pd.DataFrame(data)
    
    # data frame contains the median info
    medianDF = df.groupby(df[0]).median().T
    medianDF = medianDF.fillna(-1)
    
    # data frame contains the number info
    sizeSeries = df.groupby(df[0]).size()
   
    # data frame contains the mean info
    meanDF = df.groupby(df[0]).mean().T
    meanDF = meanDF.fillna(-1)
    
    # start to process the data
    sizeList = []
    totalNum = 0
    for key in sizeSeries.index:
        sizeList.append((key,int(sizeSeries[key])))
        totalNum += int(sizeSeries[key])

    # sort by the size
    sizeList.sort(lambda x,y:cmp(x[1],y[1]),reverse=True) 

    rtData = {}
    curNum = 0
    curStr = 0
    
    # figure out the measurement
   
    divisor = 3600*24*7
        
    for tran,num in sizeList:
        medianArr = [0,]
        medianArr.extend([(float(x) / divisor) for x in medianDF[tran].values if x != -1])
        meanArr = [0,]
        meanArr.extend([(float(x) / divisor) for x in meanDF[tran].values if x != -1])
        rtData[tran] = {"num":num,"ts":medianArr,"meants":meanArr}
        curNum += num
        curStr += 1
        # return 15 transision at most
        if curNum > totalNum * 0.9:
            break
        if curStr >= 15:
            break

    return rtData


    
def workflowInit(db):
    cursor = conDB(db)
    if cursor == None:
        return None
        
    # fetch the data from db and transform it into list
    sql = "SELECT transition, " + sqlTS + " FROM iwe_statustran"
    cursor.execute(sql)
    rawD = cursor.fetchall()
    rtData = processWFdata(rawD)
    
    return rtData
    

# get the data from selectors, first try session, if not cached then try database    
def getWorkflow(db):
        
    workflowD = workflowInit(db)
    return workflowD
    
def fetchWorkflow(selectors):
    
    sql = "SELECT transition, " + sqlTS + " FROM iwe_statustran "
    conSql = buildSQL(selectors)
    if conSql != None:
        sql += conSql
    cursor = conDB(session["curDb"])
    cursor.execute(sql)
    rawD = cursor.fetchall()
    if len(rawD) == 0:
        return None
    else:
        return processWFdata(rawD)
    
    