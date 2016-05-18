from flask import Flask, jsonify, request, redirect, url_for, render_template, session
app = Flask(__name__)

@app.route('/')
def index():
    return render_template('main.html')    

if __name__ == '__main__':
    app.run(debug=True,threaded=True) 