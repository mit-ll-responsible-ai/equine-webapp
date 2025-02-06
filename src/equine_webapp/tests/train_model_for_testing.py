# Copyright (c) 2023 Massachusetts Institute of Technology
# SPDX-License-Identifier: MIT
import numpy as np
import os
from sklearn.datasets import make_blobs
import torch

import equine as eq
from equine_webapp.utils import SERVER_CONFIG

TEST_MODEL_CONFIG = {
    "emb_out_dim": 16,
    "epochs": 50,
    "examples_per_class": 500,
    "model_name": "protonet_test_model.eq",
    "num_classes": 4,
    "protonet_num_episodes": 100,
    "support_size": 20,
    "tensor_dim": 2,
    "train_ratio": 0.8,
    "test_ratio": 0.2,
}

def train_model_for_testing(save_path):
    n_samples = TEST_MODEL_CONFIG["examples_per_class"] * TEST_MODEL_CONFIG["num_classes"]
    centers = [ (2,2), (-2,2), (-2,-2), (2,-2), (0,0) ]
    x_list, y_list = make_blobs(n_samples=n_samples, n_features=TEST_MODEL_CONFIG["tensor_dim"], 
                                centers=centers, cluster_std=0.75, shuffle=False,random_state=52)
    # Randomize the classes in the middle
    rng = np.random.default_rng(seed=52)
    y_list[(n_samples*4//5):] = rng.integers(4, size=n_samples//5) 
    X = torch.FloatTensor(x_list)
    Y = torch.tensor(y_list)

    dataset = torch.utils.data.TensorDataset(X,Y)
    trainset, testset = torch.utils.data.random_split(dataset, [TEST_MODEL_CONFIG["train_ratio"], TEST_MODEL_CONFIG["test_ratio"]], 
                        generator=torch.Generator().manual_seed(52))
    train_x = trainset.dataset.tensors[0][trainset.indices]
    train_y = trainset.dataset.tensors[1][trainset.indices]
    test_x  = testset.dataset.tensors[0][testset.indices]
    test_y  = testset.dataset.tensors[1][testset.indices]

    vanilla_nn = EmbeddingModel()
    loss_fn = torch.nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(vanilla_nn.parameters())

    trainloader = torch.utils.data.DataLoader(trainset,batch_size=50,shuffle=True)

    vanilla_nn.train()
    for epoch in range(TEST_MODEL_CONFIG["epochs"]):
        epoch_loss = 0.0
        for i, (xs, labels) in enumerate(trainloader):
            optimizer.zero_grad()
            yhats = vanilla_nn(xs)
            loss = loss_fn(yhats, labels)
            loss.backward()
            optimizer.step()
            epoch_loss += loss.item()
        if epoch%50 == 49 or epoch == 0:
            print(f"Epoch {epoch+1} has loss {epoch_loss:3.2f}")

    # Load weights from the trained model
    sd = vanilla_nn.state_dict()
    em = EmbeddingModel()
    em.load_state_dict(sd)

    # Pull out the feature embedding
    all_layers = list(vanilla_nn.children())
    embedding_layers = all_layers[0][:-1] # Remove the last layer
    embedding_model = torch.nn.Sequential(*embedding_layers) # Rebuild the NN

    # Create the EQUINE model, support examples, and pointers to those examples 
    model = eq.EquineProtonet(embedding_model, emb_out_dim=TEST_MODEL_CONFIG["emb_out_dim"])

    model.train_model(torch.utils.data.TensorDataset(train_x,train_y),
                    way=4,             # Number of classes to train each episode
                    support_size=TEST_MODEL_CONFIG["support_size"],           # Number of support examples per class each episode
                    num_episodes=TEST_MODEL_CONFIG["protonet_num_episodes"], # Number of episodes (like epochs)
                    episode_size=100)  # Number training points selected per episode (like batches)
    model.save(save_path)

    test_df = pd.DataFrame( test_x.numpy() ) # convert the test data into a np array, then into a data frame
    test_df.to_csv(os.path.join(SERVER_CONFIG.UPLOAD_FOLDER_PATH, "test_no_labels.csv"),index=False) #save to a csv

    return

class EmbeddingModel(torch.nn.Module):
    def __init__(self):
        super(EmbeddingModel, self).__init__()
        self.linear_relu_stack = torch.nn.Sequential(
            torch.nn.Linear(TEST_MODEL_CONFIG["tensor_dim"], TEST_MODEL_CONFIG["emb_out_dim"]),
            torch.nn.ReLU(),
            torch.nn.Linear(TEST_MODEL_CONFIG["emb_out_dim"], TEST_MODEL_CONFIG["emb_out_dim"]),
            torch.nn.ReLU(),
            torch.nn.Linear(TEST_MODEL_CONFIG["emb_out_dim"], TEST_MODEL_CONFIG["emb_out_dim"]),
            torch.nn.ReLU(),
            torch.nn.Linear(TEST_MODEL_CONFIG["emb_out_dim"], TEST_MODEL_CONFIG["num_classes"])
        )
    def forward(self, x):
        logits = self.linear_relu_stack(x)
        return logits
