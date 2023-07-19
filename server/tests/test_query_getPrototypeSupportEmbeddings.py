import numpy as np
import os
import pytest

from server.tests.train_model_for_testing import TEST_MODEL_CONFIG
from server.tests.utils import assert_confidence_labels_are_valid
from server.utils import load_equine_model, SERVER_CONFIG

def test_query_models(client):
    model_path = os.path.join(os.getcwd(), SERVER_CONFIG.MODEL_FOLDER_PATH, "protonet_test_model.eq")
    model = load_equine_model(model_path)
    model_support = model.model.support



    response = client.post("/graphql", json={
        "query": """
            query GetPrototypeSupportEmbeddings($modelFilename:String!) {
              getPrototypeSupportEmbeddings(modelFilename:$modelFilename) {
                label
                prototype
                trainingExamples {
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
              }
            }
        """,
        "variables": {"modelFilename": "protonet_test_model.eq"},
    })

    embeddings = response.json["data"]["getPrototypeSupportEmbeddings"]
    assert len(embeddings) == TEST_MODEL_CONFIG["num_classes"] # correct number of classes
    for label_idx, embedding in enumerate(embeddings):
        assert str(label_idx) == embedding["label"] # correct label

        # embeddings
        assert len(embedding["prototype"]) == TEST_MODEL_CONFIG["emb_out_dim"] # correct embedding vector size
        all(isinstance(item, float) for item in embedding["prototype"]) # all coordinates are floats

        for support_idx, support in enumerate(embedding["trainingExamples"]):
            # coordinates
            assert len(support["coordinates"]) == TEST_MODEL_CONFIG["emb_out_dim"] # correct embedding vector size
            assert all(isinstance(item, float) for item in support["coordinates"]) # all coordinates are floats

            # ood is between 0 and 1
            assert support["ood"] >= 0.0
            assert support["ood"] <= 1.0

            # input data
            data_index = support["inputData"]["dataIndex"]
            support_data_idx = TEST_MODEL_CONFIG["support_size"]*label_idx + support_idx
            assert data_index == support_data_idx
            
            # request the render data and assert that the right support example data is being sent
            render_support_response = client.post("/graphql", json={
                "query": """
                    query RenderSupportFeatureData($modelName: String!, $dataIndex: Int!) {
                      renderSupportFeatureData(modelName:$modelName, dataIndex: $dataIndex){
                        featureData,
                        columnHeaders
                      }
                    }
                """,
                "variables": {"dataIndex": data_index, "modelName": "protonet_test_model.eq"},
            })
            assert np.allclose(
                np.array(render_support_response.json["data"]["renderSupportFeatureData"]["featureData"]),
                np.array(model_support[label_idx][support_idx]),
                atol=1e-6
            )
            assert render_support_response.json["data"]["renderSupportFeatureData"]["columnHeaders"] == ["0", "1"]

            # labels
            assert_confidence_labels_are_valid(support["labels"])

# TODO test images?