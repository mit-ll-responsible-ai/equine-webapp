# Copyright (c) 2023 Massachusetts Institute of Technology
# SPDX-License-Identifier: MIT

import os

import torch
import equine as eq
from pathlib import Path
from typing import Optional

class Config:
    MODEL_EXT: str = ".eq"
    OUTPUT_FOLDER: str
    SCHEMA_PATH: str

    def __init__(self):
        dir_path = os.path.dirname(os.path.realpath(__file__))
        self.SCHEMA_PATH = os.path.join(dir_path, "graphql/types")
        if os.environ.get('TESTING') == "True":
            self.OUTPUT_FOLDER = os.path.join(dir_path, "tests/temp")
        else:
            self.OUTPUT_FOLDER = os.path.join(dir_path, "webapp-output")
            
        self.MODEL_FOLDER_PATH = os.path.join(self.OUTPUT_FOLDER, "models/") #pylint: disable=no-member
        self.UPLOAD_FOLDER_PATH = os.path.join(self.OUTPUT_FOLDER, "uploads/") #pylint: disable=no-member
        Path(self.MODEL_FOLDER_PATH).mkdir(parents=True, exist_ok=True)
        Path(self.UPLOAD_FOLDER_PATH).mkdir(parents=True, exist_ok=True)

SERVER_CONFIG = Config()

class SampleDataset:
    def __init__(self, tensor_dataset, filenames, column_headers):
        self.dataset = tensor_dataset
        self.filenames = filenames
        self.column_headers = column_headers


def combine_data_files(filename_list, is_train=False):
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

    dataset = torch.concat([data.tensors[0] for data in dataset_list], dim=0)
    
    if is_train:
        dataset_labels = torch.concat([data.tensors[1] for data in dataset_list], dim=0)
        tensor_dataset = torch.utils.data.TensorDataset(dataset, dataset_labels) #TODO Typechecking?
    else:
        tensor_dataset = torch.utils.data.TensorDataset(dataset) #TODO Typechecking?

    if len(column_headers) == 0:
        column_headers = [x for x in range(0, tensor_dataset.tensors[0].shape[1])]
    
    return SampleDataset(tensor_dataset, dataset_filenames, column_headers)


def get_support_example_from_data_index(model_name, data_index):
    data_index = int(data_index)
    assert data_index >= 0
    
    model_path = get_model_path(model_name)
    model = eq.load_equine_model(model_path)
    support = model.get_support()
    feature_names = model.get_feature_names()

    num_classes = len(support)
    num_support_per_class = support[0].shape[0]
    assert num_classes*num_support_per_class > data_index

    support_idx = data_index % num_support_per_class
    class_idx = int(data_index / num_support_per_class)

    return support[class_idx][support_idx], support, feature_names

def get_sample_from_data_index(run_id, data_index, model_name:Optional[str]=None):
    data_index = int(data_index)
    assert data_index >= 0

    feature_names = None
    if model_name is not None:
        model_path = get_model_path(model_name)
        model = eq.load_equine_model(model_path)
        feature_names = model.get_feature_names()

    run_id = int(run_id)
    sample_dataset = torch.load(os.path.join(SERVER_CONFIG.UPLOAD_FOLDER_PATH, f"{run_id}_run_data.pt"))
    assert len(sample_dataset.dataset) > data_index
    
    return sample_dataset.dataset[data_index][0], sample_dataset, feature_names

def get_model_path(model_name:str):
    model_file = model_name if SERVER_CONFIG.MODEL_EXT in model_name else model_name + SERVER_CONFIG.MODEL_EXT
    base_path = os.getcwd()
    model_path = sanitize_path(os.path.join(base_path, SERVER_CONFIG.MODEL_FOLDER_PATH, model_file), base_path)
    if not os.path.isfile(model_path):
        raise ValueError(f"Model File '{model_path}' not found")
    return model_path

def sanitize_path(file_path, base_path):
    fullpath = os.path.normpath(file_path)
    if not fullpath.startswith(base_path):
        raise Exception("Path not allowed")
    return fullpath

def use_label_names(model, num_labels:int):
    label_names = model.get_label_names()
    if label_names is not None and len(label_names) != num_labels:
        print(f"The number of label names ({len(label_names)}) does not match the number of classes ({num_labels}) in the predictions. The server will ignore the label names.")
        return None
    return label_names
