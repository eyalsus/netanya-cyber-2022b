import os
from flask import Flask, render_template, request
from sqlalchemy import create_engine
import pandas as pd

app = Flask(__name__, static_folder='static')
engine = create_engine('sqlite:///users.db')

failed_login_attempts = {}

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
    if request.remote_addr in failed_login_attempts \
        and failed_login_attempts[request.remote_addr] > 3:
        return '<h1>You have been banned!</h1>'
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
        image_path = f'{df.iloc[0].first_name}-{df.iloc[0].last_name}.webp'
        ls_result = os.popen(f'ls -lrt /Users/eyal/netanya/netanya-cyber-2022b/lesson3/static/{image_path}').read()
        if image_path in ls_result:
            return render_template('welcome.html', first_name=df.iloc[0].first_name, image_path=image_path)
        else:
            return render_template('welcome.html', first_name=df.iloc[0].first_name, image_path='user-img.png')
    else:
        if request.remote_addr not in failed_login_attempts:
            failed_login_attempts[request.remote_addr] = 1
        else:
            failed_login_attempts[request.remote_addr] += 1
        print(failed_login_attempts)
        return render_template('login.html')
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