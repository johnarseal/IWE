from flask import Flask, jsonify, request, redirect, url_for, render_template, session
from settings import *
from selectors import *
import os,json
app = Flask(__name__)

app.secret_key = "johnzz@pku.edu.cn"

# db is the database
@app.route('/<db>', methods=["GET"])
def index(db):
    session["curDb"] = db
    selInfo = getSelectors(db)
    return render_template('main.html', selInfo=selInfo)    
    
@app.route('/timetotal', methods=["GET"])
def timetotal():
    timeTotalData = fetchTimeTotal(request.args)
    return json.dumps(timeTotalData)

if __name__ == '__main__':
    app.run(debug=True,threaded=True) 