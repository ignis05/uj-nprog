import socket
import re

pattern = re.compile("^\d+$")

host = 'localhost'
port = 2020
server_addr = ('localhost', 2020)


def bytesToString(bytesData: bytes) -> str:
    stringData = bytesData.decode("ascii")
    stringData = stringData.replace('\n', '')
    stringData = stringData.replace('\r', '')
    return stringData


def getInt(bytesData: bytes) -> int:
    stringData = bytesToString(bytesData)
    if not re.search(pattern, stringData):
        print("invalid number")
        return -1
    return int(stringData, 10)


sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.connect(server_addr)
sock.settimeout(5.0)

# --- start ---

sock.send(b"21 37\r\n")
server_reply = sock.recv(65536)
if(getInt(server_reply) != 58):
    print("reply: " + bytesToString(server_reply))
    raise RuntimeError("Test failed")

sock.send(b"12345 1 1\r\n")
server_reply = sock.recv(65536)
if(getInt(server_reply) != 12347):
    print("reply: " + bytesToString(server_reply))
    raise RuntimeError("Test failed")

# cause overflow
sock.send(b"18446744073709551615 1\r\n")
server_reply = sock.recv(65536)
if(bytesToString(server_reply) != "ERROR"):
    print("reply: " + bytesToString(server_reply))
    raise RuntimeError("Test failed")

# just below overflow
sock.send(b"18446744073709551614 1\r\n")
server_reply = sock.recv(65536)
if(getInt(server_reply) != 18446744073709551615):
    print("reply: " + bytesToString(server_reply))
    raise RuntimeError("Test failed")

# add below overflow
sock.send(b"18446744073709551615 0\r\n")
server_reply = sock.recv(65536)
if(getInt(server_reply) != 18446744073709551615):
    print("reply: " + bytesToString(server_reply))
    raise RuntimeError("Test failed")

# signle number overflow
sock.send(b"18446744073709551619 1\r\n")
server_reply = sock.recv(65536)
if(bytesToString(server_reply) != "ERROR"):
    print("reply: " + bytesToString(server_reply))
    raise RuntimeError("Test failed")

sock.send(b"15 15\r\n20 20\r\n")
server_reply = sock.recv(65536)
print(bytesToString(server_reply))

# --- end ---
print("All tests passed")
sock.close()
