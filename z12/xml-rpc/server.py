from xmlrpc.server import SimpleXMLRPCServer
import sqlite3
database = './osoby.sqlite'


def query(sqlQuery="SELECT * FROM osoby"):
    conn = sqlite3.connect(database)
    crsr = conn.cursor()
    crsr.execute(sqlQuery)
    rows = crsr.fetchall()
    crsr.close()
    conn.close()
    return rows


def commit(sqlQuery):
    conn = sqlite3.connect(database)
    crsr = conn.cursor()
    crsr.execute(sqlQuery)
    crsr.close()
    conn.commit()
    conn.close()
    return 0


server = SimpleXMLRPCServer(("localhost", 8000),allow_none=True)
print("Listening on port 8000...")
server.register_function(query, "query")
server.register_function(commit, "commit")
server.serve_forever()
