browser:

```
$ ncat -l 127.0.0.1 2020
GET / HTTP/1.1
Host: localhost:2020
Connection: keep-alive
sec-ch-ua: "Chromium";v="100", " Not A;Brand";v="99"
sec-ch-ua-mobile: ?0
sec-ch-ua-platform: "Windows"
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.133 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9
Sec-Fetch-Site: none
Sec-Fetch-Mode: navigate
Sec-Fetch-User: ?1
Sec-Fetch-Dest: document
Accept-Encoding: gzip, deflate, br
Accept-Language: en-GB,en-US;q=0.9,en;q=0.8
```

curl:

```
$ ncat -l 127.0.0.1 2020
GET / HTTP/1.1
Host: localhost:2020
User-Agent: curl/7.78.0
Accept: _/_
```

curl get:

```
curl http://sphinx.if.uj.edu.pl/techwww/httptest/test

Gratulacje! Wykonałeś zapytanie HTTP GET.
```

curl post

```
curl -X POST -H "Content-Type: application/json" -d '{"name": "linuxize", "email": "linuxize@example.com"}' http://sphinx.if.uj.edu.pl/techwww/httptest/test

Gratulacje! Wykonałeś zapytanie HTTP POST z typem zawartości JSON.
```

axios post
```
$ ncat -l 127.0.0.1 3000
POST / HTTP/1.1
Accept: application/json, text/plain, */*
Content-Type: application/json
User-Agent: axios/0.27.2
Content-Length: 38
Host: localhost:3000
Connection: close

{"przedmiot":"programowanie sieciowe"}
```