from flask import Flask, jsonify, request, redirect, url_for, render_template, session
from test2 import *
from sqliteSession import SqliteSessionInterface
import os,json
app = Flask(__name__)

# db is the database
@app.route('/setsession/<db>', methods=["GET"])
def index(db):
    lastS = str(dict(session))
    session["curDb"] = db
    return lastS 
    
@app.route('/getsession', methods=["GET"])
def timetotal():
    fff()
    return json.dumps(dict(session))
    
@app.route('/api/workflow', methods=["GET"])
def workflow():
    wfData = fetchWorkflow(request.args)
    return json.dumps(wfData)
    
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
    path = '../cache/session'                     
    if not os.path.exists(path):
        os.mkdir(path)
        print "create dir"
    else:
        print "dir exists"
        
    app.session_interface = SqliteSessionInterface(path)

    app.secret_key = "johnzz@pku.edu.cn"
    app.run(debug=True,threaded=True) 