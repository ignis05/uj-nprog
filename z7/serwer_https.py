#!/usr/bin/env python3

from http.server import *
import ssl
import argparse
import sys

parser = argparse.ArgumentParser()
parser.add_argument("-s", help="Używaj SSL", action='store_true')
parser.add_argument("-p", "--port", type=int, help="Numer portu", default=4443)
args = parser.parse_args()

httpd = HTTPServer(('localhost', args.port), SimpleHTTPRequestHandler)

if args.s == True:
    httpd.socket = ssl.wrap_socket (httpd.socket, certfile='./server_key_and_cert.pem', server_side=True)
httpd.serve_forever()
