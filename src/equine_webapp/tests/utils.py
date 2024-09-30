# Copyright (c) 2023 Massachusetts Institute of Technology
# SPDX-License-Identifier: MIT
import math

from equine_webapp.tests.train_model_for_testing import TEST_MODEL_CONFIG

def assert_confidence_labels_are_valid(labels):
    assert len(labels) == TEST_MODEL_CONFIG["num_classes"] # correct number of classes
    sum_confidences = 0.0
    for label_idx, label in enumerate(labels):
        assert str(label_idx) == label["label"]

        # the confidence is between 0 and 1
        assert label["confidence"] >= 0.0
        assert label["confidence"] <= 1.0
        sum_confidences += label["confidence"] # sum the confidence scores
    assert math.isclose(sum_confidences, 1.0, abs_tol=0.00001) # the confidences sum close to 1