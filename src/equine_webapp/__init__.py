from waitress import serve
from equine_webapp.flask_server import app


def main():
    print("Starting equine_webapp server on localhost:8080")
    serve(app, host='0.0.0.0', port=8080)
