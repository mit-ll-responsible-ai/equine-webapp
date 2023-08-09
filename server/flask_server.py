# Copyright (c) 2023 Massachusetts Institute of Technology
# SPDX-License-Identifier: MIT

import os
import io
import json

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from ariadne.explorer import ExplorerGraphiQL
from ariadne import combine_multipart_data, graphql_sync

import torch
from torchvision.transforms import ToPILImage

from .utils import SERVER_CONFIG, get_support_example_from_data_index, get_sample_from_data_index
from .graphql.graphql_config import schema

# Flask App Setup ################################
app = Flask(__name__)
# app.config["CORS_HEADERS"] = "Content-Type"
CORS(app)

# GraphQL Setup ##################################
explorer_html = ExplorerGraphiQL().html(None)


# Helper Functions ###############################
def StartServer():
    """
    Helper function to quickly start the flask server on port 5252.
    """
    app.run(port=5252, debug=False)

def clear_folder(folder_path):
    """
    Helper function to clear all files in the given folder on server.

    Parameters
    ----------
    folder_path : str
        Path of directory to be cleared.
    """
    for filename in os.listdir(folder_path):
        os.remove(os.path.join(folder_path, filename))


# App Routes #####################################
@app.route('/')
def hello():
    return 'Hello world!'

@app.route("/graphql", methods=["GET"])
def graphql_explorer():
    """
    Flask GET Route to serve GraphQL explorer UI.

    Returns
    -------
    html, int
        HTML of GraphQL explorer UI, along with server status code.
    """
    return explorer_html, 200

@app.route("/graphql", methods=["POST"])
def graphql_server():
    """
    Flask POST Route to handle all graphQL API requests.

    Returns
    -------
    json, int
        Json result of GraphQL Query/Mutation along with the server status code.
    """
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

@app.route("/render-image/inference/<run_id>/<data_index>", methods=["GET"])
def handle_render_inference_image(run_id, data_index):
    """ 
    Flask Route to send image inference as image file to the frontend.
    
    Parameters
    ----------
    run_id : int
        ID number of the inference run that contained the image to be rendered.
    data_index : int
        Index in the inference run file of the image to be rendered.

    Returns
    -------
    File
        Selected image file.

    """
    sample, _ = get_sample_from_data_index(run_id, data_index)
    return send_img_tensor_as_file(sample, f"{run_id}_{data_index}")

    

@app.route("/render-image/support/<model_name>/<data_index>", methods=["GET"])
def handle_render_support_image(model_name, data_index):
    """ 
    Flask Route to render model support examples on the frontend.
    
    Parameters
    ----------
    model_name : str
        Filename of the model to get support images from.
    data_index : int
        Index in the support examples where the selected image resides.

    Returns
    -------
    File
        Selected image file

    """
    support_example, _ = get_support_example_from_data_index(model_name, data_index)
    return send_img_tensor_as_file(support_example, f"{model_name}_{data_index}")

def send_img_tensor_as_file(img_tensor, filename):
    """ 
    Flask Route to convert an image torch tensor to a PNG file.
    
    Parameters
    ----------
    image tensor : torch.Tensor
        Tensor containing the image data.
    filename : str
        Name to save the converted PNG image as.

    Returns
    -------
    File
        Converted image file

    """
    img = ToPILImage()(img_tensor.to(torch.uint8))
    img_buf = io.BytesIO()
    img.save(img_buf, format="png")
    img_buf.seek(0)

    return send_file(img_buf, download_name=f"{filename}.png")

@app.route("/models/<model_name>", methods=["GET"])
def handle_send_model(model_name):
    """ 
    Flask Route to download models from the server.
    
        Parameters
        ----------
        model_name : str
            Filename of model to be downloaded.

        Returns
        -------
        File
            Selected Equine model file

    """
    return send_file(os.path.join(os.getcwd(), SERVER_CONFIG.MODEL_FOLDER_PATH, model_name), download_name=model_name)
