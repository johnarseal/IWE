from flask import Flask, jsonify, request, redirect, url_for, render_template, session
from settings import *
from selectors import *
from workflow import *
from impact import *
from timetrend import *
import os,json

app = Flask(__name__,static_folder='iwe/static')
# setting secret_key for nginx_uwsgi
app.secret_key = "johnzz@pku.edu.cn"

# db is the database
@app.route('/iwe/demo/<db>', methods=["GET"])
def index(db):
    # DS = dataset
    session["DS"] = db
    selInfo = getSelectors(db)
    workflowData = getWorkflow(db)
    resrateData = fetchResRate([])
    resTimeData = fetchResTime([])
    ttWFData = fetchttWF([])
    return render_template('main.html', selInfo=selInfo,workflowData=workflowData,resrateData=resrateData,resTimeData=resTimeData,ttWFData=ttWFData)    
    
@app.route('/iwe/api/timetotal', methods=["GET"])
def timetotal():
    timeTotalData = fetchTimeTotal(request.args)
    return json.dumps(timeTotalData)
    
@app.route('/iwe/api/workflow', methods=["GET"])
def workflow():
    wfData = fetchWorkflow(request.args)
    return json.dumps(wfData)
    
@app.route('/iwe/api/resrate', methods=["GET"])
def resrate():
    resRateData = fetchResRate(request.args)
    return json.dumps(resRateData)
    
@app.route('/iwe/api/restime', methods=["GET"])
def restime():
    resTimeData = fetchResTime(request.args)
    return json.dumps(resTimeData)
    
@app.route('/iwe/api/timetrend/wf', methods=["GET"])
def ttwf():
    ttWFData = fetchttWF(request.args)
    return json.dumps(ttWFData)

@app.route('/iwe/api/timetrend/resrate', methods=["GET"])
def ttresrate():
    ttRRData = fetchttResRate(request.args)
    return json.dumps(ttRRData)

@app.route('/iwe/api/timetrend/restime', methods=["GET"])
def ttrestime():
    ttRTData = fetchttResTime(request.args)    
    return json.dumps(ttRTData)
    
@app.route('/iwe/debug/<db>/flushsession', methods=["GET"])
def destroySession(db):
    if db in session:
        session[db] = {}
        return "session destroyed"
    else:
        return "no session exists"

# for debug use
@app.route('/iwe/debug/listsession', methods=["GET"])
def listSession():
    return json.dumps(dict(session))

# code below will not be executed in deploying environment
if __name__ == '__main__':
    app.run(debug=True,threaded=True,port=7777)