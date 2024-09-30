# Copyright (c) 2023 Massachusetts Institute of Technology
# SPDX-License-Identifier: MIT
import os
import pytest
import shutil

os.environ["TESTING"] = "True"

from equine_webapp.flask_server import app as my_app
from equine_webapp.utils import SERVER_CONFIG
from equine_webapp.tests.train_model_for_testing import train_model_for_testing, TEST_MODEL_CONFIG

@pytest.fixture()
def app():
    my_app.config.update({ "TESTING": True })
    # other setup can go here
    yield my_app
    # clean up / reset resources here


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def runner(app):
    return app.test_cli_runner()


def pytest_configure():
    train_model_for_testing(os.path.join(SERVER_CONFIG.MODEL_FOLDER_PATH, TEST_MODEL_CONFIG["model_name"]))


def pytest_sessionfinish(session, exitstatus):
    shutil.rmtree(SERVER_CONFIG.OUTPUT_FOLDER)
    pass
