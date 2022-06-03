#!/usr/bin/python3
# -*- coding: UTF-8 -*-
'''
Przykład banalnej aplikacji WWW zgodnej ze specyfikacją WSGI (Python Web
Server Gateway Interface).

Oryginalna wersja specyfikacji, przeznaczona dla Pythona 2, jest dostępna
pod <https://www.python.org/dev/peps/pep-0333>. Wersja uwzględniająca zmiany
wprowadzone w Pythonie 3 jest pod <https://www.python.org/dev/peps/pep-3333>.

Najważniejsze informacje:
- punktem wejścia do aplikacji WSGI może być funkcja albo klasa
- serwer HTTP wywołuje funkcję (albo konstruktor) przekazując jako pierwszy
  argument słownik ze środowiskiem WSGI, a w nim m.in. nagłówki zapytania
- jeśli zapytanie HTTP miało nie tylko nagłówki, ale również tzw. ciało, czyli
  treść o długości podanej w nagłówku Content-Length, to będzie ona dostępna
  w strumieniu environment['wsgi.input']
- drugim argumentem jest referencja do funkcji pozwalającej wyspecyfikować
  status oraz nagłówki generowanej odpowiedzi HTTP
- funkcja-aplikacja zwraca właściwą treść odpowiedzi jako swój wynik; musi to
  być obiekt pozwalający się iterować (a więc np. tablica), iterowane elementy
  są jeden za drugim odsyłane klientowi HTTP

Informacje specyficzne dla Pythona 3:
- łańcuchy Pythona są unikodowe, podobnie jak w Javie
- wg specyfikacji HTTP nagłówki zapytań i odpowiedzi są ciągami bajtów
  w kodowaniu ISO-8859-1, można więc je jednoznacznie skonwertować do/z
  postaci unikodowych łańcuchów, i dla wygody jest to automatycznie robione
- treść po nagłówkach może być tekstem w dowolnym kodowaniu albo wręcz danymi
  binarnymi, programista musi je przetwarzać jako ciągi bajtów
- typ Pythona o nazwie bytes reprezentuje ciągi bajtów
- jeśli w zmiennej s jest łańcuch, to można go zamienić na bajty albo przez
  rzutowanie bytes(s, 'UTF-8'), albo przez wywołanie s.encode('UTF-8')
- bajty b konwertujemy na łańcuch przez str(b, 'UTF-8') lub b.decode('UTF-8')
- specjalna notacja b'znaki ASCII' pozwala wyspecyfikować stałą typu bytes

W poniższym kodzie używana jest funkcja repr. Jako argument można jej podać
dowolną wartość lub obiekt; zwraca tekstową reprezentację argumentu.
'''

def hello_app(environment, start_response):
    headers = [
        ('Content-Type', 'text/plain; charset=UTF-8'),
        ('Server', 'HelloApp/1.0'),
    ]
    start_response('200 OK', headers);

    envdump = 'Środowisko WSGI:\n{\n'
    for k in sorted(environment.keys()):
        envdump += repr(k) + ': ' + repr(environment[k]) + ',\n'
    envdump += '}\n'

    return [ b'Hello, world!\n\n', envdump.encode('UTF-8') ]

# Poniższy fragment pozwala uruchomić zdefiniowaną powyżej aplikację wewnątrz
# deweloperskiego serwera HTTP/WSGI po wydaniu z linii poleceń komendy
#     python3 hello_webapp.py
# Aby sprawdzić czy aplikacja działa otwórz w przeglądarce adres
#     http://localhost:8000/
# Możesz też zamiast przeglądarki użyć innego narzędzia, wydaj np. polecenie
#     curl -v http://localhost:8000/
#
# Jeśli nie chcemy aby środowisko linuksowej powłoki "przeciekało" do
# środowiska WSGI można uruchomić serwer za pośrednictwem programu env,
# który potrafi je wyzerować:
#     env -i python3 hello_webapp.py
#
if __name__ == '__main__':
    from wsgiref.simple_server import make_server
    port = 8002
    httpd = make_server('', port, hello_app)
    print('Listening on port %i, press ^C to stop.' % port)
    httpd.serve_forever()
