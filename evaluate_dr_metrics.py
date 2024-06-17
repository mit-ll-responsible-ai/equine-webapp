import heapq
import numpy as np

from server.graphql.query_resolvers import resolve_get_protonet_support_embeddings, resolve_dimensionality_reduction
from server.graphql.mutation_resolvers import resolve_run_inference

# TODO eventually this script should do a parameter sweep on different values of tolerance levels
OUTLIER_TOLERANCE = 0.95
CLASS_CONFIDENCE_THRESHOLD = 0.7

# these are the model files we want to evaluate
model_files = [
    "vis_MNIST_GP_32D.eq",
    "vis_MNIST_GP_1024D.eq",
]

# these are the files of test samples to evaluate on
test_sample_files = [
    # "some_digits.pt",
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
            points = list(p.detach().numpy() for p in points)
            metrics_dict["ood"].append(resolve_dimensionality_reduction(None, {},method=method, data=points, n_neighbors=5)) # get the metrics
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
            points = list(p.detach().numpy() for p in points)
            metrics_dict["confident"].append(resolve_dimensionality_reduction(None, {},method=method, data=points, n_neighbors=5)) # get the metrics
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
            points = list(p.detach().numpy() for p in points)
            metrics_dict["confused_class"].append(resolve_dimensionality_reduction(None, {}, method=method, data=points, n_neighbors=5)) # get the metrics

    # print("ood_count",ood_count,"confused_count",confused_count,"confident_count",confident_count)

    return metrics_dict



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



if __name__ == "__main__":
    # iterate over the models we are evaluating
    for model_file in model_files:
        # run inference all the test samples from the files
        inference_data = resolve_run_inference(None, {}, model_file, test_sample_files)
        samples = inference_data["samples"]
        

        # calculate metrics
        uq_data = resolve_get_protonet_support_embeddings(None, {}, model_file)
        metrics_dict = get_metrics_for_method(samples, uq_data, "pca")
        metrics_list = metrics_dict["ood"] + metrics_dict["confident"] + metrics_dict["confused_class"]
        get_metrics_as_np_arrays(metrics_list, model_file, "pca")

    