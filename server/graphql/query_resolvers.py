# Copyright (c) 2023 Massachusetts Institute of Technology
# SPDX-License-Identifier: MIT
import os

# dimensionality reduction
import numpy as np
from sklearn.manifold import MDS, trustworthiness, TSNE
from sklearn.decomposition import PCA
from scipy.spatial import distance_matrix
import umap

import torch
import pandas as pd
from ariadne import convert_kwargs_to_snake_case

from server.utils import SERVER_CONFIG, load_equine_model, calc_continuity, calc_normalized_stress, calc_shepard_diagram_correlation, get_support_example_from_data_index, get_sample_from_data_index

@convert_kwargs_to_snake_case
def resolve_available_models(_, info, extension):
    model_folder = os.path.join(os.getcwd(), SERVER_CONFIG.MODEL_FOLDER_PATH)

    filter_extension = extension if extension else SERVER_CONFIG.MODEL_EXT
    model_files = [x for x in os.listdir(model_folder) if filter_extension in x]

    request_data = []
    for file_name in model_files:
        model_path = os.path.join(model_folder, file_name)
        last_mod_time = os.path.getmtime(model_path)
        request_data.append({"name": file_name, "lastModified" : last_mod_time})

    return request_data

@convert_kwargs_to_snake_case
def resolve_model_summary(_, info, model_name):
    model_file = model_name if SERVER_CONFIG.MODEL_EXT in model_name else model_name + SERVER_CONFIG.MODEL_EXT
    model_path = os.path.join(os.getcwd(), SERVER_CONFIG.MODEL_FOLDER_PATH, model_file)

    if not os.path.isfile(model_path):
        raise ValueError(f"Model File '{model_path}' not found")
    
    model_save = torch.load(model_path)
    summary = model_save["train_summary"]
    print("summary",summary)
    summary["lastModified"] = os.path.getmtime(model_path)

    return summary

@convert_kwargs_to_snake_case
def resolve_get_protonet_support_embeddings(_, info, model_filename): #TODO how does this work with EquineGP?
    model_file = model_filename if SERVER_CONFIG.MODEL_EXT in model_filename else model_filename + SERVER_CONFIG.MODEL_EXT
    model_path = os.path.join(os.getcwd(), SERVER_CONFIG.MODEL_FOLDER_PATH, model_file)
    if not os.path.isfile(model_path):
        raise ValueError(f"Model File '{model_path}' not found")
    
    model = load_equine_model(model_path)
    support_examples = model.model.support
    
    dataIndex = 0 # initialize the data index counter for the support examples
    support_data_points = []
    for i, label in enumerate(support_examples.keys()):
        label_point = {
            "label": str(label),
            "prototype": model.model.prototypes[i],
            "trainingExamples": []
        }

        predictions = model.predict(support_examples[label])
        for j in range(len(predictions.embeddings)):
            label_point["trainingExamples"].append({
                "coordinates": predictions.embeddings[j],
                "inputData": {
                    "dataIndex": dataIndex,
                },
                "labels": [{
                    "label": str(idx),
                    "confidence": d,
                } for idx,d in enumerate(predictions.classes[i])],
                "ood": predictions.ood_scores[j]
            })
            dataIndex += 1 # increment the data index counter

        support_data_points.append(label_point)

    return support_data_points

@convert_kwargs_to_snake_case
def resolve_dimensionality_reduction(_, info, method, data, n_neighbors, random_state=42):
    if method == "pca":
        # ideally we want to get up to 5 scree values
        # but that is not possible if the number of dimensions is less than 5
        high_dimensions = len(data[0])
        technique = PCA(n_components=min(high_dimensions, 5)) # we have more than 2 components so we can get the scree values
    elif method == "tsne":
        technique = TSNE(n_components=2, perplexity=5, random_state=random_state)
    elif method == "mds":
        technique = MDS(n_components=2, normalized_stress=True, metric=False, random_state=random_state)
    else:
        technique = umap.UMAP(densmap=True, n_neighbors=n_neighbors, random_state=random_state) #densmap=True,
    
    data = np.array(data).astype(float)
    embeddings = technique.fit_transform(data)

    scree = None
    if method == "pca":  
        scree = technique.explained_variance_ratio_.tolist()
        embeddings = embeddings[:,0:2] # slice off dimensions 3+ that we don't need
        print(embeddings)

    # https://github.com/scikit-learn/scikit-learn/blob/9aaed498795f68e5956ea762fef9c440ca9eb239/sklearn/manifold/_mds.py#L148
    data_dist = distance_matrix(data,data)
    embedding_dist = distance_matrix(embeddings,embeddings)

    # calculate metrics
    continuity = calc_continuity(high_dist=data_dist, low_dist=embedding_dist, k=n_neighbors)
    normalized_stress = calc_normalized_stress(high_dist=data_dist, low_dist=embedding_dist)
    shepard = calc_shepard_diagram_correlation(high_dist_flat=data_dist.flatten(), low_dist_flat=embedding_dist.flatten())
    trust = trustworthiness(data, embeddings, n_neighbors=n_neighbors, metric='euclidean')

    

    return {
        "continuity": continuity,
        "embeddings": embeddings,
        "normalizedStress": normalized_stress,
        "scree": scree,
        "shepard": shepard[0],
        "trustworthiness": trust,
    }

@convert_kwargs_to_snake_case
def resolve_render_inference_feature_data(_, info, run_id, data_index):
    features, sample_dataset = get_sample_from_data_index(run_id, data_index)
    column_headers = sample_dataset.column_headers
    
    return {"featureData": features, "columnHeaders": column_headers}

@convert_kwargs_to_snake_case
def resolve_render_support_feature_data(_, info, model_name, data_index):
    support_example, support = get_support_example_from_data_index(model_name, data_index)
    features = support_example.tolist()
    column_headers = list(range(0, len(features))) #TODO can we have the model save and return the original column headings?
    
    return {"featureData": features, "columnHeaders": column_headers}

def resolve_training_progress(_, info):
    pass

@convert_kwargs_to_snake_case
def resolve_download_model(_, info, model_name):
    pass
