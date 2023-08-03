# Copyright (c) 2023 Massachusetts Institute of Technology
# SPDX-License-Identifier: MIT
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

OUTLIER_TOLERANCE = 0.95
CLASS_CONFIDENCE_THRESHOLD = 0.7

METHODS = ["pca", "tsne", "umap", "mds"]
DATA_SOURCES = ["FashionMNIST-ID_MNIST-OOD"]
K = 10


def get_metrics_for_data_source(source, K):
    for method in METHODS:
        print("---------- DATA SOURCE", source, "METHOD", method, "----------")

        local_ood_metrics = []
        local_confused_metrics = []
        local_confident_metrics = []
        global_metrics = []
        for k in range(K):
            with open(f"./uq_viz_data/{source}_k={k}/uq_viz_data.json") as json_file:
                UQ_VIZ_DATA = json.load(json_file)
            with open(f"./uq_viz_data/{source}_k={k}/samples_data.json") as json_file:
                SAMPLES_UQ_VIZ_DATA = json.load(json_file)
                
            local_metrics_dict = get_metrics_for_method(samples=SAMPLES_UQ_VIZ_DATA["samples"][0:int(len(SAMPLES_UQ_VIZ_DATA["samples"])/2)], uq_viz_data=UQ_VIZ_DATA, method=method)
            local_ood_metrics += local_metrics_dict["ood"] 
            local_confident_metrics += local_metrics_dict["confident"] 
            local_confused_metrics += local_metrics_dict["confused_class"]

            local_metrics_dict = get_metrics_for_method(samples=SAMPLES_UQ_VIZ_DATA["samples"][int(len(SAMPLES_UQ_VIZ_DATA["samples"])/2):], uq_viz_data=UQ_VIZ_DATA, method=method)
            local_ood_metrics += local_metrics_dict["ood"] 
            local_confident_metrics += local_metrics_dict["confident"] 
            local_confused_metrics += local_metrics_dict["confused_class"]
        
            global_metrics.append(
                get_pseudo_global_metrics_for_method(samples_data=SAMPLES_UQ_VIZ_DATA, uq_viz_data=UQ_VIZ_DATA, method=method)
            )
        local_metrics = local_ood_metrics + local_confused_metrics + local_confident_metrics


            
        # print the metrics in the format for a Latex table
        get_metrics_as_np_arrays(local_ood_metrics, "ood local", method)
        get_metrics_as_np_arrays(local_confident_metrics, "confused local", method)
        get_metrics_as_np_arrays(local_confused_metrics, "confident local", method)
        local_continuity, local_shepard, local_stress, local_time, local_trust = get_metrics_as_np_arrays(local_metrics, "all local", method)
        global_continuity, global_shepard, global_stress, global_time, global_trust = get_metrics_as_np_arrays(global_metrics, "global", method)
        print(f"{method}     & {format_avg_std(local_time)}    & {format_avg_std(local_continuity)}    & { format_avg_std(local_stress)}     & {format_avg_std(local_shepard)}     & {format_avg_std(local_trust)}     & {format_avg_std(global_time)}    & {format_avg_std(global_continuity)}    & { format_avg_std(global_stress)}     & {format_avg_std(global_shepard)}     & {format_avg_std(global_trust)}    \\\\")

def get_metrics_as_np_arrays(metrics_list, title, method):
    time = np.array([m['time'] for m in metrics_list])
    trust = np.array([m['trustworthiness'] for m in metrics_list])
    continuity = np.array([m['continuity'] for m in metrics_list])
    stress = np.array([m['normalized_stress'] for m in metrics_list])
    shepard = np.array([m['shepard'] for m in metrics_list])

    print(f"Method: {method} {title}, Time: {format_avg_std(time)}, Continuity: {format_avg_std(continuity)},  Stress: { format_avg_std(stress)}, Shepard: {format_avg_std(shepard)},  Trust: {format_avg_std(trust)}")

    return continuity, shepard, stress, time, trust


def format_avg_std(np_array):
    return f"{np.average(np_array):.10f} (± {np.std(np_array):.10f})"

def print_metrics_for_method(metrics):
    if len(metrics) == 0:
        print("No metrics")
        return
    time = np.array([m['time'] for m in metrics])
    trust = np.array([m['trustworthiness'] for m in metrics])
    continuity = np.array([m['continuity'] for m in metrics])
    stress = np.array([m['normalized_stress'] for m in metrics])
    shepard = np.array([m['shepard'] for m in metrics])
    print("Time average           ", "%f" % np.average(time), "std", "%f" % np.std(time))
    print("Trustworthiness average", "%f" % np.average(trust), "std", "%f" % np.std(trust))
    print("Continuity average     ", "%f" % np.average(continuity), "std", "%f" % np.std(continuity))
    print("Stress average         ", "%f" % np.average(stress), "std", "%f" % np.std(stress))
    print("Shepard average        ", "%f" % np.average(shepard), "std", "%f" % np.std(shepard))

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
                x for x in uq_viz_data["labels"] if x["label"]==closest_label["label"]
            )
            points = [closest_label["prototype"]] # add the prototype
            points = points + [t["coordinates"] for t in closest_label["training_examples"]] # add the training examples
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
                x for x in uq_viz_data["labels"] if x["label"]==most_confident_label["label"]
            )
            points = [most_confident_label["prototype"]] # add the prototype
            points = points + [t["coordinates"] for t in most_confident_label["training_examples"]] # add the training examples
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
                x for x in uq_viz_data["labels"] if x["label"]==most_confident_label["label"]
            )
            second_confident_label = next( # get the coordinates
                x for x in uq_viz_data["labels"] if x["label"]==second_confident_label["label"]
            )
            points = [most_confident_label["prototype"]] # add the prototype
            points = points + [t["coordinates"] for t in most_confident_label["training_examples"]] # add the training examples
            points = points + [second_confident_label["prototype"]] # add the prototype
            points = points + [t["coordinates"] for t in second_confident_label["training_examples"]] # add the training examples
            points = points + [sample["coordinates"]] # add the coordinates for this sample
            metrics_dict["confused_class"].append(calc_dr_metrics(method=method, data=points, n_neighbors=5)) # get the metrics

    # print("ood_count",ood_count,"confused_count",confused_count,"confident_count",confident_count)

    return metrics_dict

def get_pseudo_global_metrics_for_method(samples_data, uq_viz_data, method):
    id_samples = samples_data["samples"][0:int(len(samples_data["samples"])/2)]
    ood_samples = samples_data["samples"][int(len(samples_data["samples"])/2):]

    selected = select_random_samples(samples=id_samples, num_classes=10, num_select=25)
    selected = selected + select_random_samples(samples=ood_samples, num_classes=10, num_select=25)

    points = [s["coordinates"] for s in selected]
    for label in uq_viz_data["labels"]:
        points = points + [label["prototype"]]
        points = points + [t["coordinates"] for t in label["training_examples"]] # add the training examples
    return calc_dr_metrics(method=method, data=points, n_neighbors=5) # get the metrics

def select_random_samples(samples, num_classes, num_select):
    selected = []
    for c in range(num_classes):
        class_filter = [s for s in samples if s["true_label"]==c]
        for n in range(num_select):
            selected.append(random.choice(class_filter))
    return selected


def get_global_metrics_for_method(samples_data, uq_viz_data, method):
    points = [s["coordinates"] for s in samples_data["samples"]]
    for label in uq_viz_data["labels"]:
        points = points + [label["prototype"]]
        points = points + [t["coordinates"] for t in label["training_examples"]] # add the training examples
    return calc_dr_metrics(method=method, data=points, n_neighbors=5) # get the metrics


def calc_dr_metrics(method, data, n_neighbors, random_state=42):
    if method == "pca":  
        technique = PCA(n_components=2)
    elif method == "tsne":
        technique = sklearn.manifold.TSNE(n_components=2, perplexity=5, random_state=random_state)
    elif method == "mds":
        technique = sklearn.manifold.MDS(n_components=2, normalized_stress=True, metric=False, random_state=random_state)
    else:
        technique = umap.UMAP(densmap=True, n_neighbors=n_neighbors, random_state=random_state) #densmap=True,
    
    data = np.array(data).astype(float)
    start = timeit.default_timer()
    embeddings = technique.fit_transform(data)
    stop = timeit.default_timer()


    # https://github.com/scikit-learn/scikit-learn/blob/9aaed498795f68e5956ea762fef9c440ca9eb239/sklearn/manifold/_mds.py#L148
    data_dist = distance_matrix(data,data)
    embedding_dist = distance_matrix(embeddings,embeddings)

    # calculate metrics
    continuity = calc_continuity(high_dist=data_dist, low_dist=embedding_dist, k=n_neighbors)
    normalized_stress = calc_normalized_stress(high_dist=data_dist, low_dist=embedding_dist)
    shepard = calc_shepard_diagram_correlation(high_dist_flat=data_dist.flatten(), low_dist_flat=embedding_dist.flatten())
    trustworthiness = sklearn.manifold.trustworthiness(data, embeddings, n_neighbors=n_neighbors, metric='euclidean')

    return {
        "continuity": continuity,
        "embeddings": embeddings,
        "normalized_stress": normalized_stress,
        "shepard": shepard[0],
        "time": stop - start,
        "trustworthiness": trustworthiness,
    }


# Continuity, Normalized Stress, and Shepard correlation functions taken from 
# https://github.com/mespadoto/proj-quant-eval/blob/master/code/01_data_collection/metrics.py
def calc_continuity(high_dist, low_dist, k):
    num_samples = int(high_dist.shape[0])

    nn_orig = high_dist.argsort()
    nn_proj = low_dist.argsort()

    knn_orig = nn_orig[:, :k + 1][:, 1:]
    knn_proj = nn_proj[:, :k + 1][:, 1:]

    sum_i = 0

    for i in range(num_samples):
        V = np.setdiff1d(knn_orig[i], knn_proj[i])

        sum_j = 0
        for j in range(V.shape[0]):
            sum_j += np.where(nn_proj[i] == V[j])[0] - k

        sum_i += sum_j

    return float((1 - (2 / (num_samples * k * (2 * num_samples - 3 * k - 1)) * sum_i)))

def calc_normalized_stress(high_dist, low_dist):
    return np.sum((high_dist - low_dist)**2) / np.sum(high_dist**2)

def calc_shepard_diagram_correlation(high_dist_flat, low_dist_flat):
    return spearmanr(high_dist_flat, low_dist_flat)




for source in DATA_SOURCES:
    get_metrics_for_data_source(source=source, K=K)
