# Copyright (c) 2023 Massachusetts Institute of Technology
# SPDX-License-Identifier: MIT

import json
import numpy as np
import os
from pathlib import Path

from equine_webapp.utils import SERVER_CONFIG


def test_mutation_uploadFile(client):
    # make a temporary test folder
    folder = os.path.join(SERVER_CONFIG.OUTPUT_FOLDER, "upload_model_test/")
    Path(folder).mkdir(parents=True, exist_ok=True)
    
    # save a dummy csv file
    test_df = pd.DataFrame( [[1.0,2.0,3.0],[4.0,5.0,6.0]] )
    test_df.to_csv(os.path.join(folder, "test_upload_data_file.csv"),index=False, index_label=False)

    #https://flask.palletsprojects.com/en/2.3.x/testing/#form-data
    response = client.post("/graphql", data={
        "map": json.dumps({"test_upload_data_file.csv": ["variables.file"]}),
        "test_upload_data_file.csv": (Path(folder) / "test_upload_data_file.csv").open("rb"),
        "operations": json.dumps({
            "query": """mutation UploadSampleFile($file: Upload!) {
              uploadFile(file:$file) {
                success
              }
            }""",
            "variables": { "file": None}
        }),
    })
    
    assert response.json["data"]["uploadFile"]["success"]

    uploaded_df = pd.read_csv(
        os.path.join(SERVER_CONFIG.UPLOAD_FOLDER_PATH, "test_upload_data_file.csv"),
    )
    assert np.array_equal(test_df.values,uploaded_df.values)