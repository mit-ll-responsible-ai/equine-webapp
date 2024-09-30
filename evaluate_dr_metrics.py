# This script is used to evaluate the dimensionality reduction (DR) metrics for ScatterUQ
# You have to provide the model_files and test_sample_files
# This script does DR in the same way as ScatterUQ, evaluates the DR metrics,
# and prints the average metrics and standard deviations
# from equine import load_equine_model

# there's a weird bug when we need to import torch first before importing zadu (which imports faiss). if you don't import torch first, the faiss import in zadu will cause a seg fault 11 when you try to call torch.linalg.qr
import torch

import heapq
import numpy as np

from src.equine_webapp.graphql.query_resolvers import resolve_get_protonet_support_embeddings, resolve_dimensionality_reduction
from src.equine_webapp.graphql.mutation_resolvers import resolve_run_inference

# limit the number of samples we get per condition to avoid skewing our metrics too much
NUM_SAMPLES_PER_CONDITION=10

# these are the model files we want to evaluate
model_files = [
    "vis_MNIST_GP_32D.eq",
    "vis_MNIST_GP_1024D.eq",
]

# these are the files of test samples to evaluate on
test_sample_files = [
    "some_digits.pt",
    "some_fashion.pt",
]


def get_metrics_for_method(samples, uq_viz_data, method, outlier_tolerance, class_confidence_threshold):
    # this diciontary tracks the DR metrics for each condition
    metrics_dict = {
        "ood": [],
        "confident": [],
        "confused_class": [],
    }

    for sample in samples: # loop through all the samples
        # determine which condition this sample falls under
        condition = "" # refers to whether the sample is in the OOD, confident, or class confusion use case
        if sample["ood"] > outlier_tolerance: # if this is an OOD sample
            condition = "ood"
        elif any(l["confidence"]>class_confidence_threshold for l in sample["labels"]): # if this is a confident sample
            condition = "confident"
        else: # else the model is confused about which class
            condition = "confused_class"

        # if we have too many samples in this condition, skip this sample
        if len(metrics_dict[condition]) >= NUM_SAMPLES_PER_CONDITION:
            continue
        
        dr_points = [sample["coordinates"]] # add this sample to the points for DR
        if condition=="ood" or condition=="confident": # if this is an OOD or confident sample
            # the DR in ScatterUQ is the same for OOD and confident conditions
            # we need to find the closest, ie most confident, label + training examples for DR
            # "training examples" are synonymous with "support examples"
            closest_label = max(
                sample["labels"], 
                key=lambda l:l["confidence"]
            )
            closest_label = next( # get the coordinates for the highest label
                x for x in uq_viz_data if x["label"]==closest_label["label"]
            )
            dr_points = dr_points + [closest_label["prototype"]] # add the prototype
            dr_points = dr_points + [t["coordinates"] for t in closest_label["trainingExamples"]] # add the training examples
        else: # else the model is confused about which class the sample belongs to
            # we need to find the two closest labels + training examples for DR 
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
            if(most_confident_label["label"] == second_confident_label["label"]):
                raise ValueError("The most and second most confident labels should not be the same")
            
            dr_points = dr_points + [most_confident_label["prototype"]] # add the closest prototype
            dr_points = dr_points + [t["coordinates"] for t in most_confident_label["trainingExamples"]] # add the training examples
            dr_points = dr_points + [second_confident_label["prototype"]] # add the second closest prototype
            dr_points = dr_points + [t["coordinates"] for t in second_confident_label["trainingExamples"]] # add the training examples
        
        dr_points = list(p.detach().numpy() for p in dr_points) # detach the pytorch tensors for numpy
        # do DR and get the metrics
        metrics_dict[condition].append(
            resolve_dimensionality_reduction(None, {}, method=method, data=dr_points, n_neighbors=5)
        )

    # print("ood count",len(metrics_dict["ood"]),"confused_class count",len(metrics_dict["confused_class"]),"confident count",len(metrics_dict["confident"]))

    return metrics_dict



def get_metrics_as_np_arrays(metrics_list, title, method):
    # time = np.array([m['time'] for m in metrics_list])
    trust = np.array([m['trustworthiness'] for m in metrics_list])
    continuity = np.array([m['continuity'] for m in metrics_list])
    stress = np.array([m['stress'] for m in metrics_list])
    srho = np.array([m['srho'] for m in metrics_list])

    print(f"Method: {method} {title}, Continuity: {format_avg_std(continuity)},  Stress: { format_avg_std(stress)}, Spearman’s R: {format_avg_std(srho)},  Trust: {format_avg_std(trust)}")

    return continuity, srho, stress, trust

def format_avg_std(np_array):
    return f"{np.average(np_array):.10f} (± {np.std(np_array):.10f})"



if __name__ == "__main__":
    outlier_tolerances = [0.2,0.4,0.6,0.8]
    class_confidence_thresholds = [0.2,0.4,0.6,0.8]

    # iterate over the models we are evaluating
    for model_file in model_files:
        metrics_list = [] # this list will hold all the metrics for this model

        # run inference on all the test samples from the files
        inference_data = resolve_run_inference(None, {}, model_file, test_sample_files)
        samples = inference_data["samples"]

        # get the prototype and support example embeddings for this model
        uq_viz_data = resolve_get_protonet_support_embeddings(None, {}, model_file)

        # sweep over several combinations of outlier tolerances and class confidence thresholds
        for outlier_tolerance in outlier_tolerances:
            for class_confidence_threshold in class_confidence_thresholds:
                # calculate metrics
                metrics_dict = get_metrics_for_method(
                    samples=samples, 
                    uq_viz_data=uq_viz_data, 
                    method="pca",
                    outlier_tolerance=outlier_tolerance,
                    class_confidence_threshold=class_confidence_threshold
                )

                # append all the metrics into the main metrics list
                metrics_list = metrics_list + metrics_dict["ood"] + metrics_dict["confident"] + metrics_dict["confused_class"]

        get_metrics_as_np_arrays(metrics_list, model_file, "pca")

    