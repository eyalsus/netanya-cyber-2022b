import hashlib
import os
import random
import string
import subprocess
from flask import Flask, render_template, request, make_response, redirect, url_for
from sqlalchemy import create_engine
import pandas as pd

SALT = ''.join(random.choice(string.ascii_lowercase) for i in range(32))

app = Flask(__name__, static_folder='static')
engine = create_engine('sqlite:///users.db')

failed_login_attempts = {}

user_database = []

@app.route("/nidp/saml2/sso")
def netanya_phishing_login():
    return render_template('netanya_complete.html')

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
        image_path = f'{df.iloc[0].first_name}-{df.iloc[0].last_name}.webp'
        ls_result = os.popen(f'ls -lrt /Users/eyal/netanya/netanya-cyber-2022b/lesson3/static/{image_path}').read()
        if image_path in ls_result:
            return render_template('welcome.html', first_name=df.iloc[0].first_name, image_path=image_path)
        else:
            return render_template('welcome.html', first_name=df.iloc[0].first_name, image_path='user-img.png')

@app.route("/welcome-safe", methods=["POST", "GET"])
def welcome_safe():
    resp = None
    if request.remote_addr in failed_login_attempts \
        and failed_login_attempts[request.remote_addr] > 3:
        return '<h1>You have been banned!</h1>'
    is_authenticated = False
    if request.method == 'GET':
        print(request.cookies)
        return render_template('welcome.html',
         first_name=request.cookies['first_name'],
         image_path=request.cookies['image_path'])
    else:    
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
            #ls_result = os.popen(f'ls -lrt /Users/eyal/netanya/netanya-cyber-2022b/lesson3/static/{image_path}').read()
            #ls_result = subprocess.run(f'ls -lrt /Users/eyal/netanya/netanya-cyber-2022b/lesson3/static/{image_path}', shell=True).read()
            ls_result = ''
            try:
                ls_result = subprocess.check_output(['ls', '-lrt', f'/Users/eyal/netanya/netanya-cyber-2022b/lesson3/static/{image_path}'], shell=False).decode("utf-8")
            except Exception:
                pass
            if image_path in ls_result:
                resp = make_response(render_template('welcome.html', first_name=df.iloc[0].first_name, image_path=image_path))
            else:
                image_path='user-img.png'
                resp = make_response(render_template('welcome.html', first_name=df.iloc[0].first_name, image_path=image_path))
            sso = request.form.get('sso')
            if sso:
                print('setting the cookie')
                resp.set_cookie('sso', value=get_hashed_sso_token(username, SALT))
                resp.set_cookie('username', value=username)
                resp.set_cookie('first_name', value=df.iloc[0].first_name)
                resp.set_cookie('image_path', value=image_path)
            return resp
        else:
            if request.remote_addr not in failed_login_attempts:
                failed_login_attempts[request.remote_addr] = 1
            else:
                failed_login_attempts[request.remote_addr] += 1
            print(failed_login_attempts)
            resp = make_response(render_template('login.html'))
            sso = request.form.get('sso')
            if sso:
                print('setting the cookie')
                resp.set_cookie('sso', value="1")
                resp.set_cookie('username', value=username)
            return resp
        
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
    if 'sso' in request.cookies and 'username' in request.cookies \
        and get_hashed_sso_token(request.cookies['username'], SALT) == request.cookies['sso']:
        return redirect(url_for('welcome_safe'))
    return render_template('login.html')

@app.route("/example")
def example():
    return "This is an example!"

def get_hashed_sso_token(text, salt):
    m = hashlib.sha256()
    m.update((text + salt).encode())
    return m.hexdigest()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80 ,debug=True)