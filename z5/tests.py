import socket

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
    return int(stringData, 10)


sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
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
sock.send(b"18446744073709551615 1")
if(bytesToString(sock.recv(65536)) != "ERROR"):
    raise RuntimeError("Test failed")

# just below overflow
sock.send(b"18446744073709551614 1")
if(getInt(sock.recv(65536)) != 18446744073709551615):
    raise RuntimeError("Test failed")

# add below overflow
sock.send(b"18446744073709551615 0")
if(getInt(sock.recv(65536)) != 18446744073709551615):
    raise RuntimeError("Test failed")

# signle number overflow
sock.send(b"18446744073709551619 1")
if(bytesToString(sock.recv(65536)) != "ERROR"):
    raise RuntimeError("Test failed")

sock.send(b"15 15\r\n20 20")
print(sock.recv(65536))

# --- end ---
print("All tests passed")
sock.close()
