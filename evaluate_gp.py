import heapq
import json
import numpy as np
import random
import sklearn.manifold
from sklearn.decomposition import PCA
from scipy.spatial import distance_matrix
from scipy.stats import spearmanr
import timeit
import umap
from sklearn.manifold import MDS, trustworthiness, TSNE

from server.utils import SERVER_CONFIG, load_equine_model, calc_continuity, calc_normalized_stress,  calc_shepard_diagram_correlation, combine_data_files
import os
import torch

OUTLIER_TOLERANCE = 0.95
CLASS_CONFIDENCE_THRESHOLD = 0.7

model_files = [
    "vis_MNIST_GP_32D.eq",
    "vis_MNIST_GP_1024D.eq",
]

sample_files = [
    "some_digits.pt",
    "some_fashion.pt",
]


def get_metrics_for_method(samples, uq_viz_data, method):
    metrics_dict = {
        "ood": [],
        "confident": [],
        "confused_class": [],
    }

    ood_count = 0
    confused_count = 0
    confident_count = 0
    for sample in samples: # loop through all the samples to determine their condition
        if sample["ood"] > OUTLIER_TOLERANCE: # if this is an OOD sample
            if ood_count > 10:
                continue
            ood_count += 1
            closest_label = max( # find the label with the highest confidence which will be the closest class
            sample["labels"], 
                key=lambda l:l["confidence"]
            )
            closest_label = next( # get the coordinates for the highest label
                x for x in uq_viz_data if x["label"]==closest_label["label"]
            )
            points = [closest_label["prototype"]] # add the prototype
            points = points + [t["coordinates"] for t in closest_label["trainingExamples"]] # add the training examples
            points = points + [sample["coordinates"]] # add the coordinates for this sample
            metrics_dict["ood"].append(calc_dr_metrics(method=method, data=points, n_neighbors=5)) # get the metrics
        elif any(l["confidence"]>CLASS_CONFIDENCE_THRESHOLD for l in sample["labels"]): # if this is a confident sample
            if confident_count > 10:
                continue
            confident_count += 1
            most_confident_label = max( # find the label with the highest confidence
                sample["labels"], 
                key=lambda l:l["confidence"]
            )
            most_confident_label = next( # get the coordinates for the highest label
                x for x in uq_viz_data if x["label"]==most_confident_label["label"]
            )
            points = [most_confident_label["prototype"]] # add the prototype
            points = points + [t["coordinates"] for t in most_confident_label["trainingExamples"]] # add the training examples
            points = points + [sample["coordinates"]] # add the coordinates for this sample
            metrics_dict["confident"].append(calc_dr_metrics(method=method, data=points, n_neighbors=5)) # get the metrics
        else: # else the model is confused about which class
            # find the two classes with the highest confidences
            if confused_count > 10:
                continue
            confused_count += 1
            [most_confident_label, second_confident_label] = heapq.nlargest(
                2, sample["labels"],
                key=lambda l:l["confidence"]
            )
            most_confident_label = next( # get the coordinates
                x for x in uq_viz_data if x["label"]==most_confident_label["label"]
            )
            second_confident_label = next( # get the coordinates
                x for x in uq_viz_data if x["label"]==second_confident_label["label"]
            )
            points = [most_confident_label["prototype"]] # add the prototype
            points = points + [t["coordinates"] for t in most_confident_label["trainingExamples"]] # add the training examples
            points = points + [second_confident_label["prototype"]] # add the prototype
            points = points + [t["coordinates"] for t in second_confident_label["trainingExamples"]] # add the training examples
            points = points + [sample["coordinates"]] # add the coordinates for this sample
            metrics_dict["confused_class"].append(calc_dr_metrics(method=method, data=points, n_neighbors=5)) # get the metrics

    # print("ood_count",ood_count,"confused_count",confused_count,"confident_count",confident_count)

    return metrics_dict


def calc_dr_metrics(method, data, n_neighbors, random_state=42):
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
    if method == "pca":  
        scree = technique.explained_variance_ratio_.tolist()
        embeddings = embeddings[:,0:2] # slice off dimensions 3+ that we don't need
        # print(embeddings)

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


def run_inference(model, sample_filename):
    input_dtype = next(model.embedding_model.parameters()).dtype
    sample_dataset = combine_data_files([sample_filename])
    predictions = model.predict(sample_dataset.dataset.tensors[0].to(input_dtype))
    samples_json = []

    for i in range(len(sample_dataset.dataset)):
        json_data = {
            "coordinates": predictions.embeddings[i].detach().numpy(),
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
    return samples_json

def get_uq_data(model):
    support_examples = model.get_support()
    prototypes = model.get_prototypes()
    
    dataIndex = 0 # initialize the data index counter for the support examples
    support_data_points = []
    for i, label in enumerate(support_examples.keys()):
        label_point = {
            "label": str(label),
            "prototype": prototypes[i].detach().numpy(),
            "trainingExamples": []
        }

        predictions = model.predict(support_examples[label])
        for j in range(len(predictions.embeddings)):
            label_point["trainingExamples"].append({
                "coordinates": predictions.embeddings[j].detach().numpy(),
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

def get_metrics_as_np_arrays(metrics_list, title, method):
    # time = np.array([m['time'] for m in metrics_list])
    trust = np.array([m['trustworthiness'] for m in metrics_list])
    continuity = np.array([m['continuity'] for m in metrics_list])
    stress = np.array([m['normalizedStress'] for m in metrics_list])
    shepard = np.array([m['shepard'] for m in metrics_list])

    print(f"Method: {method} {title}, Continuity: {format_avg_std(continuity)},  Stress: { format_avg_std(stress)}, Shepard: {format_avg_std(shepard)},  Trust: {format_avg_std(trust)}")

    return continuity, shepard, stress, trust

def format_avg_std(np_array):
    return f"{np.average(np_array):.10f} (± {np.std(np_array):.10f})"


for model_file in model_files:
    model_file = model_file if SERVER_CONFIG.MODEL_EXT in model_file else model_file + SERVER_CONFIG.MODEL_EXT
    model_path = os.path.join(os.getcwd(), SERVER_CONFIG.MODEL_FOLDER_PATH, model_file)
    if not os.path.isfile(model_path):
        raise ValueError(f"Model File '{model_path}' not found")
    
    model = load_equine_model(model_path)
    uq_data = get_uq_data(model)
    samples = []

    for sample_file in sample_files:
        samples = samples + run_inference(model, sample_file)
    
    metrics_dict = get_metrics_for_method(samples, uq_data, "pca")

    metrics_list = metrics_dict["ood"] + metrics_dict["confident"] + metrics_dict["confused_class"]

    get_metrics_as_np_arrays(metrics_list, model_file, "pca")

    