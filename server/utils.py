# Copyright (c) 2023 Massachusetts Institute of Technology
# SPDX-License-Identifier: MIT

import os
import json

import torch
import equine
import pandas as pd
from scipy.stats import spearmanr
import numpy as np
from pathlib import Path

class Config:
    """
    A class for loading server config files into a useable format.
    """
    def __init__(self):
        conf_path = "./server/server_config.json"
        if os.environ.get('TESTING') == "True":
            conf_path = "./server/server_config.test.json"

        with open(conf_path) as json_file:
            data = json.load(json_file)

        for k,v in data.items():
            setattr(self, k, v)
            
        self.MODEL_FOLDER_PATH = os.path.join(self.OUTPUT_FOLDER, "models/") #pylint: disable=no-member
        self.UPLOAD_FOLDER_PATH = os.path.join(self.OUTPUT_FOLDER, "uploads/") #pylint: disable=no-member
        Path(self.MODEL_FOLDER_PATH).mkdir(parents=True, exist_ok=True)
        Path(self.UPLOAD_FOLDER_PATH).mkdir(parents=True, exist_ok=True)

SERVER_CONFIG = Config()

class SampleDataset:
    """
    A class to hold datasets of inference samples and the associated metadata.

    Parameters
    ----------
    dataset : torch.utils.data.TensorDataset
        TensorDataset to be stored.
    filenames : List[str]
        The filenames each sample in the TensorDataset came from.
    column_headers : List[Any]
        The list of column headers for the dataset.
    """
    def __init__(self, tensor_dataset, filenames, column_headers):
        self.dataset = tensor_dataset
        self.filenames = filenames
        self.column_headers = column_headers

def load_equine_model(model_path):
    """
    Function to load given equine model based on model type.

    Parameters
    ----------
    model_path : str
        Filepath of the model to be loaded.

    Returns
    -------
    Equine
        The loaded equine model.
    """
    model_type = torch.load(model_path)["train_summary"]["modelType"]

    if model_type == "EquineProtonet":
        model = equine.EquineProtonet.load(model_path)
    elif model_type == "EquineGP":
        model = equine.EquineGP.load(model_path)
    else:
        raise ValueError(f"Unknown model type '{model_type}'")
    
    return model


def combine_data_files(filename_list, is_train=False):
    """
    Function to combine all given data files into one torch dataset.
    Expects the column dimentions to be equivalent.

    Parameters
    ----------
    filename_list : List[str]
        List of data filenames to be combined.
    is_train : bool
        If using combined file for training, includes dataset labels in returned dataset.

    Returns
    -------
    SampleDataset
        A SampleDatset object containing the tensor dataset, along with the associated filenames and column headers.
    """
    dataset_list = []
    dataset_filenames = []
    column_headers = []

    for filename in filename_list:
        file_path = os.path.join(os.getcwd(), SERVER_CONFIG.UPLOAD_FOLDER_PATH, filename)
        if not os.path.isfile(file_path):
            raise ValueError(f"Data File '{file_path}' not found")
        
        file_ext = os.path.splitext(filename)[1]
        if file_ext == ".csv":
            dataframe = pd.read_csv(file_path)
            if is_train:
                data_labels = dataframe["labels"].to_numpy()
                dataframe = dataframe.drop(["labels"], axis=1)
                torch_labels = torch.from_numpy(data_labels)
            
            data_array = dataframe.to_numpy()
            torch_data = torch.from_numpy(data_array)
            if is_train:
                tensor_dataset = torch.utils.data.TensorDataset(torch_data, torch_labels)
            else:
                tensor_dataset = torch.utils.data.TensorDataset(torch_data)

            column_headers = dataframe.columns
            
        elif file_ext == ".pt":
            tensor_dataset = torch.load(file_path)
        else:
            raise ValueError(f"Given file '{filename} has unsupported file type '{file_ext}'")
        
        dataset_filenames += [filename]*len(tensor_dataset.tensors[0])
        dataset_list.append(tensor_dataset)

    dataset = torch.concat([data.tensors[0] for data in dataset_list], dim=1)
    
    if is_train:
        dataset_labels = torch.concat([data.tensors[1] for data in dataset_list], dim=0)
        tensor_dataset = torch.utils.data.TensorDataset(dataset, dataset_labels) #TODO Typechecking?
    else:
        tensor_dataset = torch.utils.data.TensorDataset(dataset) #TODO Typechecking?

    if len(column_headers) == 0:
        column_headers = [x for x in range(0, tensor_dataset.tensors[0].shape[1])]
    
    return SampleDataset(tensor_dataset, dataset_filenames, column_headers)


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


def get_support_example_from_data_index(model_name, data_index):
    """
    Function to extract a specific support example from a trained equine model.

    Parameters
    ----------
    model_name : str
        Name of the model to get the support example from.
    data_index : int
        Index of the support example in the model.

    Returns
    -------
    torch.Tensor, Dict
        Selected model support tensor, along with full model support example dict.
    """
    data_index = int(data_index)
    assert data_index >= 0
    
    model_path = os.path.join(os.getcwd(), SERVER_CONFIG.MODEL_FOLDER_PATH, model_name)
    model = load_equine_model(model_path)
    support = model.model.support

    num_classes = len(support)
    num_support_per_class = support[0].shape[0]
    assert num_classes*num_support_per_class > data_index

    support_idx = data_index % num_support_per_class
    class_idx = int(data_index / num_support_per_class)

    return support[class_idx][support_idx], support

def get_sample_from_data_index(run_id, data_index):
    """
    Function to extract a specific sample from a inference run.

    Parameters
    ----------
    run_id : int
        ID of the run to extract the sample from.
    data_index : int
        Index of the sample to get.

    Returns
    -------
    torch.Tensor, SampleDataset
        Selected sample tensor, along with the full Sample dataset.
    """
    data_index = int(data_index)
    assert data_index >= 0

    run_id = int(run_id)
    sample_dataset = torch.load(os.path.join(SERVER_CONFIG.UPLOAD_FOLDER_PATH, f"{run_id}_run_data.pt"))
    assert len(sample_dataset.dataset) > data_index
    
    return sample_dataset.dataset[data_index][0], sample_dataset