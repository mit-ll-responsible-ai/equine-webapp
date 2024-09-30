# Copyright (c) 2023 Massachusetts Institute of Technology
# SPDX-License-Identifier: MIT

import time

from equine_webapp.tests.train_model_for_testing import TEST_MODEL_CONFIG


def test_query_models(client):
    response = client.post("/graphql", json={
        "query": """
            query QueryModels($extension:String!) {
              models(extension: $extension) {
                name
                lastModified
              }
            }
        """,
        "variables": {"extension": ".eq"},
    })
    results = response.json["data"]["models"]

    # this is the model we just trained in ariadne_server/tests/conftest.py
    assert results[0]["name"] == TEST_MODEL_CONFIG["model_name"]
    # check that the model was trained recently, since we won't know for sure when it will have finished
    assert abs(results[0]["lastModified"] - time.time()) < 100