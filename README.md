# EQUINE Webapp

<p align="center">
  <img width="500" src="client/public/EQUI(NE)^2_Full_Logo.svg">
</p>

![TypeScript](https://badgen.net/badge/-/TypeScript/blue?icon=typescript&label)
<p align="center">
  This is a web application utilizing EQUINE for neural network uncertainty quantification through a visual user interface. The webapp allows you to upload your own model and data, and let the server retrain the model with EQUINE. The visualization dashboard also allows you to analyze your samples and view uncertainty quantification visualizations to explain model uncertainty.
</p>


## Setup Python Flask Server
1. Create a new Anaconda environment
```
conda create --name equine-webapp python=3.10
```

2. Activate your new environment
```
conda activate equine-webapp
```

3. Install the necessary packages from pip
```
pip install -r requirements.txt
```

4. Start the Flask server
```
python start_server.py
```

### Flask Testing
If you'd like to run our flask tests:
1. Install pytest
```
pip install pytest
```

2. Run pytest
```
pytest
```

## Disclaimer

DISTRIBUTION STATEMENT A. Approved for public release. Distribution is unlimited.

© 2023 MASSACHUSETTS INSTITUTE OF TECHNOLOGY

- Subject to FAR 52.227-11 – Patent Rights – Ownership by the Contractor (May 2014)
- SPDX-License-Identifier: MIT

This material is based upon work supported by the Under Secretary of Defense for Research and Engineering under Air Force Contract No. FA8702-15-D-0001. Any opinions, findings, conclusions or recommendations expressed in this material are those of the author(s) and do not necessarily reflect the views of the Under Secretary of Defense for Research and Engineering.

The software/firmware is provided to you on an As-Is basis.
