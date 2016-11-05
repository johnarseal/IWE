from flask import Flask, jsonify, request, redirect, url_for, render_template, session, current_app, send_from_directory
from settings import *
from selectors import *
from workflow import *
from impact import *
from timetrend import *
import os,json,time

app = Flask(__name__)

# setting secret_key for nginx_uwsgi

app.secret_key = "johnzz@pku.edu.cn"

app.config.update(dict(
    UPLOAD_FOLDER='data'
))

@app.route('/iwe/demo', methods=["GET"])
def index0():
    session["fse"] = True
    return redirect(url_for('index', db='mozilla'))
 
# db is the database
@app.route('/iwe/demo/<db>')
def index(db):
    
    # DS = dataset
    session["DS"] = db
    session["tmtp"] = "rpt"
    if not session.has_key("fse"):
        session["fse"] = False

    selInfo = getSelectors(db)

    #resrateData = fetchResRate([])

    #resTimeData = fetchResTime([])

    #ttWFData = fetchttWF([])

    return render_template('demo.html', selInfo=selInfo,project=db)    


# db is the database
@app.route('/iwe/about', methods=["GET"])
def about():
    # DS = dataset
    if session["fse"] == True:
        return render_template('about.html',project=session["DS"])
    else:
        return render_template('about0.html',project=session["DS"])

@app.route('/iwe/screen_cast', methods=["GET"])
def screen_cast():
    # DS = dataset
    return render_template('screen_cast.html',project=session["DS"])

@app.route('/iwe/dataset', methods=["GET"])
def dataset():
    # DS = dataset
    return render_template('dataset.html',project=session["DS"])

@app.route('/iwe/download/<path:fname>', methods=["GET","POST"])
def download(fname):
    print fname
    dfilepath = os.path.join(current_app.root_path, app.config['UPLOAD_FOLDER'])
    print dfilepath
    return send_from_directory(directory=dfilepath, filename=fname)
    
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

@app.route('/iwe/api/tmtp/<tp>',methods=["POST"])
def setTimeType(tp):
    session["tmtp"] = tp
    return tp

# for debug use
@app.route('/iwe/debug/listsession', methods=["GET"])
def listSession():
    return json.dumps(dict(session))

# code below will not be executed in deploying environment
if __name__ == '__main__':
    app.run(debug=True,threaded=True,port=7777)