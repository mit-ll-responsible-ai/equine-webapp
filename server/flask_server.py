# Copyright (c) 2023 Massachusetts Institute of Technology
# SPDX-License-Identifier: MIT

import os
import io
import json

from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from ariadne.explorer import ExplorerGraphiQL
from ariadne import combine_multipart_data, graphql_sync

import torch
from torchvision.transforms import ToPILImage

from .utils import SERVER_CONFIG, get_support_example_from_data_index, get_sample_from_data_index
from .graphql.graphql_config import schema

# Flask App Setup ################################
app = Flask(
    __name__,
    static_url_path="/equine-webapp",
    static_folder="./client",
)
# app.config["CORS_HEADERS"] = "Content-Type"
CORS(app)

# GraphQL Setup ##################################
explorer_html = ExplorerGraphiQL().html(None)


# Helper Functions ###############################
def StartServer():
    app.run(port=5252, debug=True) #TODO remove debug


# App Routes #####################################

@app.route("/graphql", methods=["GET"])
def graphql_explorer():
    # On GET request serve the GraphQL explorer.
    return explorer_html, 200

@app.route("/graphql", methods=["POST"])
def graphql_server():
    if request.content_type.startswith("multipart/form-data"):
        data = combine_multipart_data(
            json.loads(request.form.get("operations")),
            json.loads(request.form.get("map")),
            dict(request.files)
        )
    else:
        data = request.get_json()
    success, result = graphql_sync(
        schema,
        data,
        context_value=request,
        debug=app.debug
    )
    status_code = 200 if success else 400
    return jsonify(result), status_code

@app.route("/api/render-image/inference/<run_id>/<data_index>", methods=["GET"])
def handle_render_inference_image(run_id, data_index):
    sample, _, _ = get_sample_from_data_index(run_id, data_index)
    return send_img_tensor_as_file(sample, f"{run_id}_{data_index}")

    

@app.route("/api/render-image/support/<model_name>/<data_index>", methods=["GET"])
def handle_render_support_image(model_name, data_index):
    support_example, _, _ = get_support_example_from_data_index(model_name, data_index)
    return send_img_tensor_as_file(support_example, f"{model_name}_{data_index}")

def send_img_tensor_as_file(img_tensor, filename):
    img = ToPILImage()(img_tensor.to(torch.uint8))
    img_buf = io.BytesIO()
    img.save(img_buf, format="png")
    img_buf.seek(0)

    return send_file(img_buf, download_name=f"{filename}.png")

@app.route("/api/models/<model_name>", methods=["GET"])
def handle_send_model(model_name):
    return send_file(os.path.join(os.getcwd(), SERVER_CONFIG.MODEL_FOLDER_PATH, model_name), download_name=model_name)



# Serve static index.html when accessing / with no path
@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

# Serve other static files from /<path:filename>
@app.route('/<path:filename>')
def serve_static(filename):
    if os.path.isfile(os.path.join(app.static_folder,filename+".html")):
        return send_from_directory(app.static_folder, filename+".html")
    return send_from_directory(app.static_folder, filename)