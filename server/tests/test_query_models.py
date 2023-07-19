import pytest
import time

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

    # this is the model we just trained in ariadne_server/tests/conftest.py
    assert response.json["data"]["models"][0]["name"] == "protonet_test_model.eq"
    # check that the model was trained recently, since we won't know for sure when it will have finished
    assert abs(response.json["data"]["models"][0]["lastModified"] - time.time()) < 100