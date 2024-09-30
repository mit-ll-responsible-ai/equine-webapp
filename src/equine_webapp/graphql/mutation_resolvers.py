# Copyright (c) 2023 Massachusetts Institute of Technology
# SPDX-License-Identifier: MIT
import os

import time
import torch
import equine as eq
from ariadne import convert_kwargs_to_snake_case

from equine_webapp.utils import SERVER_CONFIG, combine_data_files, get_model_path, use_label_names

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
def resolve_run_inference(_, info, model_name, sample_filenames):
    run_id = int(time.time()) #TODO Better way to generate ID?
    
    # load the model
    model_path = get_model_path(model_name)
    model = eq.load_equine_model(model_path)
    input_dtype = next(model.embedding_model.parameters()).dtype
    
    # run inference on the samples
    sample_dataset = combine_data_files(sample_filenames)
    predictions = model.predict(sample_dataset.dataset.tensors[0].to(input_dtype))

    # get the string names of the labels that the model was trained on
    label_names = use_label_names(model, predictions.classes.shape[-1])
    
    # this list will hold all the samples data to send back to the client
    samples_json = []

    # loop through all the samples
    for sample_idx in range(len(sample_dataset.dataset)):
        json_data = {
            "coordinates": predictions.embeddings[sample_idx],
            "inputData": {
                "file": sample_dataset.filenames[sample_idx],
                "dataIndex" : sample_idx
            },
            "labels": [{
                "label": label_names[label_idx] if label_names is not None else str(label_idx),
                "confidence": d,
            } for label_idx,d in enumerate(predictions.classes[sample_idx])],
            "ood": predictions.ood_scores[sample_idx]
        }

        samples_json.append(json_data)

    save_filename = f"{run_id}_run_data.pt"
    torch.save(sample_dataset, os.path.join(SERVER_CONFIG.UPLOAD_FOLDER_PATH, save_filename))

    return {
        "samples": samples_json,
        "version": eq.__version__,
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
        model = eq.EquineProtonet(embed_model, emb_out_dim)
        model.train_model(dataset, num_episodes=episodes)
    elif train_model_type == "EquineGP":
        model = eq.EquineGP(embed_model, emb_out_dim, num_classes)

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
