from flask import Flask, render_template, request
from sqlalchemy import create_engine
import pandas as pd

app = Flask(__name__)
engine = create_engine('sqlite:///users.db')


user_database = []

@app.route("/")
def hello_world():
    return "<h1>Hello, World!</h1>"

@app.route("/welcome", methods=["POST"])
def welcome():
    is_authenticated = False
    username = request.form.get('username')
    password = request.form.get('password')
    conn = engine.connect()
    df = pd.read_sql(f"""
        SELECT * 
        FROM users
        WHERE user_name = '{username}'
        AND password = '{password}'
    """, conn)
    if len(df) > 0:
        is_authenticated = True
    return render_template('welcome.html', first_name=df.iloc[0].first_name)

@app.route("/welcome-safe", methods=["POST"])
def welcome_safe():
    is_authenticated = False
    username = request.form.get('username')
    password = request.form.get('password')
    conn = engine.connect()
    df = pd.read_sql(f"""
        SELECT * 
        FROM users
        WHERE user_name = :username
        AND password = :password
    """, conn, params={'username': username, 'password': password})
    if len(df) > 0:
        is_authenticated = True
    return render_template('welcome.html', first_name=df.iloc[0].first_name)

@app.route("/add-user", methods=["POST"])
def add_user():
    firstname = request.form.get('firstname')
    lastname = request.form.get('lastname')
    username = request.form.get('username')
    password = request.form.get('password')
    new_user_df = pd.DataFrame.from_dict([{
        'first_name': firstname,
        'last_name': lastname,
        'user_name': username,
        'password': password
    }])
    conn = engine.connect()
    new_user_df.to_sql('users', conn, if_exists='append', index=False)
    return render_template('welcome.html', first_name=firstname)

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
    app.run(host='0.0.0.0', port=8080 ,debug=True)