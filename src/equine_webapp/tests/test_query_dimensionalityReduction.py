# Copyright (c) 2023 Massachusetts Institute of Technology
# SPDX-License-Identifier: MIT

import random
from equine_webapp.tests.train_model_for_testing import TEST_MODEL_CONFIG
from equine_webapp.tests.utils import assert_confidence_labels_are_valid

def test_query_models(client):
    # create a NUM_VECTORS x VECTOR_SIZE matrix of random floats
    NUM_VECTORS = 30
    VECTOR_SIZE = 10
    data = []
    for i in range(NUM_VECTORS):
        data.append([random.uniform(-100, 100) for _ in range(VECTOR_SIZE)])

    response = client.post("/graphql", json={
        "query": """
          query DimensionalityReduction(
            $method: String!, 
            $data:[[Float!]!]!, 
            $nNeighbors: Int!,
          ) {
            dimensionalityReduction(method: $method, data:$data, nNeighbors:$nNeighbors) {
              continuity
              embeddings
              stress
              scree
              srho
              trustworthiness
            }
          }
        """,
        "variables": {
            "method": "pca",
            "data": data,
            "nNeighbors": 5,
        },
    })

    response_data = response.json["data"]["dimensionalityReduction"]

    assert response_data["continuity"] >= 0.0
    assert response_data["continuity"] <= 1.0

    assert response_data["stress"] >= 0.0

    assert response_data["srho"] >= 0.0
    assert response_data["srho"] <= 1.0

    assert response_data["trustworthiness"] >= 0.0
    assert response_data["trustworthiness"] <= 1.0

    assert len(response_data["embeddings"]) == NUM_VECTORS
    for embedding_2d in response_data["embeddings"]:
        assert len(embedding_2d) == 2 # correct embedding vector size
        all(isinstance(item, float) for item in embedding_2d) # all coordinates are floats

    assert len(response_data["scree"]) == 5
    all(isinstance(item, float) for item in response_data["scree"])
    all(item >= 0 for item in response_data["scree"])
    all(item <= 1 for item in response_data["scree"])