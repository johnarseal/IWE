from flask import Flask, jsonify, request, redirect, url_for, render_template, session
app = Flask(__name__)

@app.route('/iwe/demo', methods=["GET"])
def index():
    return "hello world"

@app.route('/demo', methods=["GET"])
def index2():
    return "hello world"

if __name__ == '__main__':

    app.secret_key = "johnzz@pku.edu.cn"
    app.run(debug=True,threaded=True,port=7777)