# Copyright (c) 2023 Massachusetts Institute of Technology
# SPDX-License-Identifier: MIT

def test_static_web_files(client):
    response = client.get("/")
    is_html_str(response.text)
    assert "<title>EQUINE Webapp</title>" in response.text


    response = client.get("/dashboard")
    is_html_str(response.text)
    assert "<title>EQUINE Webapp</title>" in response.text

    response = client.get("/demo")
    is_html_str(response.text)
    assert "<title>EQUINE Webapp</title>" in response.text

    response = client.get("/download")
    is_html_str(response.text)
    assert "<title>EQUINE Webapp</title>" in response.text

    response = client.get("/model-summary-page")
    is_html_str(response.text)
    assert "<title>EQUINE Webapp</title>" in response.text

    response = client.get("/settings")
    is_html_str(response.text)
    assert "<title>EQUINE Webapp</title>" in response.text

    response = client.get("/training")
    is_html_str(response.text)
    assert "<title>EQUINE Webapp</title>" in response.text


def is_html_str(text:str):
    assert text.startswith('<!DOCTYPE html><html lang="en">')
    assert text.endswith('</html>')