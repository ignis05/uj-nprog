import os
print('Content-type: text/html\r\n\r\n')
print('<h1>Parametry:</h1>')
for param in os.environ.keys():
    print(f"<b>{param}</b>: {os.environ[param]}</br>")
