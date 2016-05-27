from flask import Flask, jsonify, request, redirect, url_for, render_template, session
from settings import *
from selectors import *
from workflow import *
from impact import *
import os,json
app = Flask(__name__)

# db is the database
@app.route('/demo/<db>', methods=["GET"])
def index(db):
    lastS = str(dict(session))
    session["curDb"] = db
    selInfo = getSelectors(db)
    workflowData = getWorkflow(db)
    return render_template('main.html', selInfo=selInfo, workflowData=workflowData)    
    
@app.route('/api/timetotal', methods=["GET"])
def timetotal():
    timeTotalData = fetchTimeTotal(request.args)
    return json.dumps(timeTotalData)
    
@app.route('/api/workflow', methods=["GET"])
def workflow():
    wfData = fetchWorkflow(request.args)
    return json.dumps(wfData)
    
@app.route('/api/resrate', methods=["GET"])
def resrate():
    resRateData = fetchResRate(request.args)
    return json.dumps(resRateData)
    
@app.route('/api/restime', methods=["GET"])
def restime():
    resTimeData = fetchResTime(request.args)
    return json.dumps(resTimeData)
    
@app.route('/debug/<db>/flushsession', methods=["GET"])
def destroySession(db):
    if db in session:
        session[db] = {}
        return "session destroyed"
    else:
        return "no session exists"

# for debug use
@app.route('/debug/listsession', methods=["GET"])
def listSession():
    return json.dumps(dict(session))


if __name__ == '__main__':
    """
    path = '../cache/session'                     
    if not os.path.exists(path):
        os.mkdir(path)
        
    app.session_interface = SqliteSessionInterface(path)
    """

    app.secret_key = "johnzz@pku.edu.cn"
    app.run(debug=True,threaded=True)