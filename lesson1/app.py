from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
def hello_world():
    return "<h1>Hello, World!</h1>"

@app.route("/welcome", methods=["POST"])
def welcome():
    return "Welcome"

@app.route("/register")
def register():
    return render_template('register.html')

@app.route("/login")
def login():
    return render_template('login.html')

@app.route("/example")
def example():
    return "This is an example!"

if __name__ == '__main__':
    app.run(debug=True)