import os
import os.path
import socket
import sys

host = 'localhost'
port = 2020
server_addr = ('localhost', 2020)


def bytesToString(bytesData):
    stringData = bytesData.decode("ascii")
    stringData = stringData.replace('\x00', '')
    stringData = stringData.replace('\n', '')
    stringData = stringData.replace('\r', '')
    return stringData


def getInt(bytesData):
    stringData = bytesToString(bytesData)
    return int(stringData, 10)


sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.connect(server_addr)
sock.settimeout(5.0)

# --- start ---

sock.send(b"21 37")
server_reply = sock.recv(65536)
if(getInt(server_reply) != 58):
    raise RuntimeError("Test failed")

sock.send(b"12345 1 1")
if(getInt(sock.recv(65536)) != 12347):
    raise RuntimeError("Test failed")

# cause overflow
sock.send(b"4294967295 1")
if(bytesToString(sock.recv(65536)) != "ERROR"):
    raise RuntimeError("Test failed")

# just below overflow
sock.send(b"4294967294 1")
if(getInt(sock.recv(65536)) != 4294967295):
    raise RuntimeError("Test failed")

# add below overflow
sock.send(b"4294967295 0")
if(getInt(sock.recv(65536)) != 4294967295):
    raise RuntimeError("Test failed")

# signle number overflow
sock.send(b"4294967295999 1")
if(bytesToString(sock.recv(65536)) != "ERROR"):
    raise RuntimeError("Test failed")

# --- end ---
print("All tests passed")
sock.close()
