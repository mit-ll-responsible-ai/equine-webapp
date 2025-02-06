# Copyright (c) 2023 Massachusetts Institute of Technology
# SPDX-License-Identifier: MIT

import numpy as np
import os
import time

from equine_webapp.utils import SERVER_CONFIG
from equine_webapp.tests.utils import assert_confidence_labels_are_valid
from equine_webapp.tests.train_model_for_testing import TEST_MODEL_CONFIG

def test_mutation_runInference(client):
    response = client.post("/graphql", json={
        "query": """
            mutation Test($modelName: String!) {
              runInference(modelName: $modelName, sampleFilenames: ["test_no_labels.csv"]) {
                samples {
                  coordinates
                  inputData {
                    dataIndex
                  }
                  labels {
                    label
                    confidence
                  }
                  ood
                }
                runId
              }
            }
        """,
        "variables": {"modelName": TEST_MODEL_CONFIG["model_name"]},
    })


    # assert that the runInference run happened recently
    run_inference_result = response.json["data"]["runInference"]
    run_id = run_inference_result["runId"]
    assert abs(run_id - time.time()) < 100  

    # assert that the number of inference samples is correct
    test_data_size = int(TEST_MODEL_CONFIG["examples_per_class"]*TEST_MODEL_CONFIG["num_classes"]*TEST_MODEL_CONFIG["test_ratio"])
    assert len(run_inference_result["samples"]) == test_data_size

    # load the test data hard coded in train_model_for_testing.py
    test_df = pd.read_csv(os.path.join(SERVER_CONFIG.UPLOAD_FOLDER_PATH, "test_no_labels.csv"))

    # loop through all the samples to make sure they're correct
    for idx, sample in enumerate(run_inference_result["samples"]):
        # coordinates
        assert len(sample["coordinates"]) == TEST_MODEL_CONFIG["emb_out_dim"] # expected number of coorindates
        assert all(isinstance(item, float) for item in sample["coordinates"]) # all coordinates are floats

        # ood is between 0 and 1
        assert sample["ood"] >= 0.0
        assert sample["ood"] <= 1.0

        # input data
        data_index = sample["inputData"]["dataIndex"]
        assert data_index == idx

        # request the render data and assert that the right inference sample data is being sent
        render_inference_response = client.post("/graphql", json={
            "query": """
                query RenderInferenceFeatureData($runId: Int!, $modelName: String!, $dataIndex: Int!) {
                  renderInferenceFeatureData(runId:$runId, modelName: $modelName, dataIndex: $dataIndex){
                    featureData,
                    columnHeaders
                  }
                }
            """,
            "variables": {"dataIndex": data_index, "modelName": TEST_MODEL_CONFIG["model_name"], "runId": run_id},
        })
        render_inference_result = render_inference_response.json["data"]["renderInferenceFeatureData"]
        assert np.allclose(
            np.array(render_inference_result["featureData"]),
            np.array(test_df.iloc[idx].tolist()),
            atol=1e-6
        )
        assert render_inference_result["columnHeaders"] == ["0", "1"]
        
        # labels
        assert_confidence_labels_are_valid(sample["labels"])

# TODO test images?