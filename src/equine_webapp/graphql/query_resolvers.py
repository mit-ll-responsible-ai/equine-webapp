# Copyright (c) 2023 Massachusetts Institute of Technology
# SPDX-License-Identifier: MIT
from zadu import zadu


# dimensionality reduction
import numpy as np
from sklearn.manifold import MDS, TSNE
from sklearn.decomposition import PCA
import umap


import equine as eq
import torch
import os
from ariadne import convert_kwargs_to_snake_case

from equine_webapp.utils import SERVER_CONFIG, get_support_example_from_data_index, get_sample_from_data_index, get_model_path, use_label_names

@convert_kwargs_to_snake_case
def resolve_available_models(_, info, extension):
    model_folder = os.path.join(os.getcwd(), SERVER_CONFIG.MODEL_FOLDER_PATH)

    filter_extension = extension if extension else SERVER_CONFIG.MODEL_EXT
    model_files = sorted([x for x in os.listdir(model_folder) if filter_extension in x])

    request_data = []
    for file_name in model_files:
        model_path = os.path.join(model_folder, file_name)
        last_mod_time = os.path.getmtime(model_path)
        request_data.append({"name": file_name, "lastModified" : last_mod_time})

    return request_data

@convert_kwargs_to_snake_case
def resolve_model_summary(_, info, model_name):
    model_path = get_model_path(model_name)
    model_save = torch.load(model_path)
    summary = model_save["train_summary"]
    summary["lastModified"] = os.path.getmtime(model_path)
    return summary

@convert_kwargs_to_snake_case
def resolve_get_protonet_support_embeddings(_, info, model_name):
    model_path = get_model_path(model_name)
    model = eq.load_equine_model(model_path)
    support_examples = model.get_support()
    prototypes = model.get_prototypes()
    
    # initialize the data index counter for the support examples
    # the client will use this counter to request the input data for this support example
    dataIndex = 0

    # get the string names of the labels that the model was trained on
    label_names = use_label_names(model, len(support_examples.keys()))

    # this list will hold all the prototype and support example embedding data for all labels
    embedding_data = []

    # loop over all labels
    for label_idx in support_examples.keys():
        prototype_and_support_data = {
            "label": label_names[label_idx] if label_names is not None else str(label_idx), # get the label name
            "prototype": prototypes[label_idx], # get the prototype
            "trainingExamples": [] # initialize a list for the support examples
        }

        # run inference on all the support examples to get the embedding data
        support_example_predictions = model.predict(support_examples[label_idx])
        
        # loop over all the support examples
        for support_idx in range(len(support_example_predictions.embeddings)):
            # append this support example embedding data to the trainingExamples list
            prototype_and_support_data["trainingExamples"].append({
                # get the embedding coordinates for this support example
                "coordinates": support_example_predictions.embeddings[support_idx],
                "inputData": { "dataIndex": dataIndex, },
                # get all the class confidence predictions for this support example
                "labels": [{
                    "label": label_names[nested_label_idx] if label_names is not None else str(nested_label_idx),
                    "confidence": d,
                } for nested_label_idx,d in enumerate(support_example_predictions.classes[support_idx])],
                # get the OOD score for this support example
                "ood": support_example_predictions.ood_scores[support_idx]
            })
            dataIndex += 1 # increment the data index counter

        embedding_data.append(prototype_and_support_data)

    return embedding_data

@convert_kwargs_to_snake_case
def resolve_dimensionality_reduction(_, info, method, data, n_neighbors, random_state=42):
    high_dimensions = len(data[0])
    num_samples = len(data)

    if method == "pca":
        # ideally we want to get up to 5 scree values
        # but that is not possible if the number of dimensions is less than 5
        technique = PCA(n_components=min(high_dimensions, 5)) # we have more than 2 components so we can get the scree values
    elif method == "tsne":
        technique = TSNE(n_components=2, perplexity=5, random_state=random_state)
    elif method == "mds":
        technique = MDS(n_components=2, normalized_stress=True, metric=False, random_state=random_state)
    else:
        technique = umap.UMAP(densmap=True, n_neighbors=min(high_dimensions, num_samples, n_neighbors), random_state=random_state, n_jobs=1) #densmap=True,
    data = np.array(data).astype(float)
    embeddings = technique.fit_transform(data)

    scree = None
    if isinstance(technique, PCA):
        scree = technique.explained_variance_ratio_.tolist()
        embeddings = embeddings[:,0:2] # slice off dimensions 3+ that we don't need

    zadu_obj = zadu.ZADU([
        { "id": "tnc", "params": {"k": n_neighbors} },
        { "id": "stress" },
        { "id": "srho" }
    ], data)
    scores = zadu_obj.measure(embeddings)

    trustworthiness = scores[0]["trustworthiness"]
    continuity = scores[0]["continuity"]
    stress = scores[1]["stress"]
    srho = scores[2]["spearman_rho"]

    return {
        "continuity": continuity,
        "embeddings": embeddings,
        "stress": stress,
        "scree": scree,
        "srho": srho,
        "trustworthiness": trustworthiness,
    }

@convert_kwargs_to_snake_case
def resolve_render_inference_feature_data(_, info, run_id, model_name, data_index):
    featureData, _, feature_names = get_sample_from_data_index(run_id, data_index, model_name=model_name)
    columnHeaders = feature_names if feature_names is not None else list(range(len(featureData)))
    assert len(featureData) == len(columnHeaders)
    
    return {"featureData": featureData, "columnHeaders": columnHeaders}

@convert_kwargs_to_snake_case
def resolve_render_support_feature_data(_, info, model_name, data_index):
    support_example, _, feature_names = get_support_example_from_data_index(model_name, data_index)
    featureData = support_example.tolist()
    columnHeaders = feature_names if feature_names is not None else list(range(len(featureData)))
    assert len(featureData) == len(columnHeaders)
    
    return {"featureData": featureData, "columnHeaders": columnHeaders}

def resolve_training_progress(_, info):
    pass

@convert_kwargs_to_snake_case
def resolve_download_model(_, info, model_name):
    pass
