import socket
import re

pattern = re.compile("^\d+$")

host = 'localhost'
port = 2020
server_addr = ('localhost', 2020)


def bytesToString(bytesData: bytes) -> str:
    stringData = bytesData.decode("ascii")
    return stringData


def getInt(bytesData: bytes) -> int:
    stringData = bytesToString(bytesData).replace('\n', '').replace('\r', '')
    if not re.search(pattern, stringData):
        print("invalid number")
        return -1
    return int(stringData, 10)


def getIntFromString(stringData: str) -> int:
    stringData = stringData.replace('\n', '').replace('\r', '')
    if not re.search(pattern, stringData):
        print("invalid number")
        return -1
    return int(stringData, 10)


sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.connect(server_addr)
sock.settimeout(120)

# --- start ---

sock.send(b"21 37\r\n")
server_reply = sock.recv(65536)
if(getInt(server_reply) != 58):
    print("reply: " + bytesToString(server_reply))
    raise RuntimeError("Test failed")
print(f"test 1 passed")

sock.send(b"12345 1 1\r\n")
server_reply = sock.recv(65536)
if(getInt(server_reply) != 12347):
    print("reply: " + bytesToString(server_reply))
    raise RuntimeError("Test failed")
print(f"test 2 passed")

# cause overflow
sock.send(b"18446744073709551615 1\r\n")
server_reply = sock.recv(65536)
if(bytesToString(server_reply) != "ERROR\r\n"):
    print("reply: " + bytesToString(server_reply))
    raise RuntimeError("Test failed")
print(f"test 3 passed")

# just below overflow
sock.send(b"18446744073709551614 1\r\n")
server_reply = sock.recv(65536)
if(getInt(server_reply) != 18446744073709551615):
    print("reply: " + bytesToString(server_reply))
    raise RuntimeError("Test failed")
print(f"test 4 passed")

# add below overflow
sock.send(b"18446744073709551615 0\r\n")
server_reply = sock.recv(65536)
if(getInt(server_reply) != 18446744073709551615):
    print("reply: " + bytesToString(server_reply))
    raise RuntimeError("Test failed")
print(f"test 5 passed")

# signle number overflow
sock.send(b"18446744073709551619 1\r\n")
server_reply = sock.recv(65536)
if(bytesToString(server_reply) != "ERROR\r\n"):
    print("reply: " + bytesToString(server_reply))
    raise RuntimeError("Test failed")
print(f"test 6 passed")

sock.send(b"15 15\r\n20 20\r\n")
server_reply = sock.recv(65536)
arr = bytesToString(server_reply).split("\r\n")
if getIntFromString(arr[0]) != 30 or getIntFromString(arr[1]) != 40:
    print("reply: " + bytesToString(server_reply))
    raise RuntimeError("Test failed")
print(f"test 7 passed")

# --- end ---
print("All tests passed")
sock.close()
