# Copyright (c) 2023 Massachusetts Institute of Technology
# SPDX-License-Identifier: MIT
import os

import json
import time
import torch
import equine
from ariadne import convert_kwargs_to_snake_case

from server.utils import SERVER_CONFIG, load_equine_model, combine_data_files

@convert_kwargs_to_snake_case
def resolve_upload_model(_, info, model_file):
    model_save_path = os.path.join(os.getcwd(), SERVER_CONFIG.MODEL_FOLDER_PATH, model_file.filename)
    model_file.save(model_save_path)

    if os.path.isfile(model_save_path):
        return {"success" : True}
    else:
        raise OSError("File not saved")
    
@convert_kwargs_to_snake_case
def resolve_upload_file(_, info, file): #TODO Deduplicate code from upload model endpoint
    save_path = os.path.join(os.getcwd(), SERVER_CONFIG.UPLOAD_FOLDER_PATH, file.name)
    file.save(save_path)

    if os.path.isfile(save_path):
        return {"success" : True}
    else:
        raise OSError("File not saved")

@convert_kwargs_to_snake_case
def resolve_run_inference(_, info, model_filename, sample_filenames):
    run_id = int(time.time()) #TODO Better way to generate ID?
    
    model_file = model_filename if SERVER_CONFIG.MODEL_EXT in model_filename else model_filename + SERVER_CONFIG.MODEL_EXT
    model_path = os.path.join(os.getcwd(), SERVER_CONFIG.MODEL_FOLDER_PATH, model_file)
    if not os.path.isfile(model_path):
        raise ValueError(f"Model File '{model_path}' not found")
    
    model = load_equine_model(model_path)
    input_dtype = next(model.embedding_model.parameters()).dtype
    sample_dataset = combine_data_files(sample_filenames)
    predictions = model.predict(sample_dataset.dataset.tensors[0].to(input_dtype))
    samples_json = []

    for i in range(len(sample_dataset.dataset)):
        json_data = {
            "coordinates": predictions.embeddings[i],
            "inputData": {
                "file": sample_dataset.filenames[i],
                "dataIndex" : i
            },
            "labels": [{
                "label": str(idx),
                "confidence": d,
            } for idx,d in enumerate(predictions.classes[i])],
            "ood": predictions.ood_scores[i]
        }

        samples_json.append(json_data)

    save_filename = f"{run_id}_run_data.pt"
    torch.save(sample_dataset, os.path.join(SERVER_CONFIG.UPLOAD_FOLDER_PATH, save_filename))

    return {
        "samples": samples_json,
        "version": equine.__version__,
        "runId" : run_id
    }


@convert_kwargs_to_snake_case
def resolve_train_model(_, info, episodes, sample_filenames, embed_model_name, new_model_name, train_model_type, emb_out_dim = 0):
    model_file = embed_model_name if ".jit" in embed_model_name else embed_model_name + ".jit"
    model_path = os.path.join(os.getcwd(), SERVER_CONFIG.MODEL_FOLDER_PATH, model_file)
    embed_model = torch.jit.load(model_path)
    input_dtype = next(embed_model.parameters()).dtype

    sample_dataset = combine_data_files(sample_filenames, is_train=True)

    X = sample_dataset.dataset.tensors[0].to(input_dtype)
    Y = sample_dataset.dataset.tensors[1]

    dataset = torch.utils.data.TensorDataset(X, Y)
    num_classes = len(torch.unique(Y))
    if emb_out_dim == 0: emb_out_dim = num_classes

    if train_model_type == "EquineProtonet":
        model = equine.EquineProtonet(embed_model, emb_out_dim)
        model.train_model(dataset, num_episodes=episodes)
    elif train_model_type == "EquineGP":
        model = equine.EquineGP(embed_model, emb_out_dim, num_classes)

        loss_fn = torch.nn.CrossEntropyLoss()
        optimizer = torch.optim.SGD(
            model.parameters(),
            lr=0.001,
            momentum=0.9,
            weight_decay=0.0001,
        )
        model.train_model(dataset, num_epochs=episodes, loss_fn=loss_fn, opt=optimizer, vis_support=True, support_size=10)
    else:
        raise ValueError(f"Given train_model_type '{train_model_type}' is not valid.")
    
    model.save(os.path.join(os.getcwd(), SERVER_CONFIG.MODEL_FOLDER_PATH, new_model_name+SERVER_CONFIG.MODEL_EXT))

    return {"success": True}
