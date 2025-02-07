# EQUINE Webapp

<p align="center">
  <img width="720" src="https://raw.githubusercontent.com/mit-ll-responsible-ai/equine-webapp/main/client/public/EQUI(NE)%5E2_Full_Logo.svg">
</p>

![TypeScript](https://badgen.net/badge/-/TypeScript/blue?icon=typescript&label)
<p align="center">
  This is a web application utilizing EQUINE for neural network uncertainty quantification through a visual user interface. The webapp allows you to upload your own model and data, and let the server retrain the model with EQUINE. The visualization dashboard also allows you to analyze your samples and view uncertainty quantification visualizations to explain model uncertainty.
</p>

<p align="center">
  The EQUINE repository is here <a href="https://github.com/mit-ll-responsible-ai/equine">https://github.com/mit-ll-responsible-ai/equine</a>
</p>

## ScatterUQ Static Demo
You can view a static demo of ScatterUQ here:

https://mit-ll-responsible-ai.github.io/equine-webapp/demo

[![ScatterUQ Out of Distribution Example](https://raw.githubusercontent.com/mit-ll-responsible-ai/equine-webapp/main/client/public/client/public/ood.png)](https://mit-ll-responsible-ai.github.io/equine-webapp/demo)

## ScatterUQ at IEEE VIS 2023
We presented ScatterUQ at IEEE VIS 2023: https://ieeexplore.ieee.org/document/10360884

Our data and analysis script can be found in this release: https://github.com/mit-ll-responsible-ai/equine-webapp/releases/tag/ScatterUQ-VIS-2023-Data


## Usage with Python and PyPI

You can install and run the equine-webapp as a command in your terminal with python. These commands create a new conda environment, activate the environment, install [equine-webapp from PyPI](https://pypi.org/project/equine-webapp/), and start the equine-webapp which will be available at `localhost:8080`.
```
conda create --name my-environment-name python=3.10
conda activate my-environment-name
pip install equine-webapp
equine-webapp
```


## Local Development

You can also develop the webapp locally in two ways:
1. Run equine-webapp as a locally installed package with local web files
2. Run equine-webapp with local Node.js/Next.js and Python/Flask development servers

### Run equine-webapp as a locally installed package with local web files
1. Install node packages
```
cd client
npm i
```

2. Make a copy of `client/.env.example` and rename to `client/.env.local`. This new file should be git-ignored by default.

3. Build the local static web files
```
npm run build
```

4. Install the package locally from the root of the repo and run it
```
../
conda create --name equine-webapp python=3.10
conda activate equine-webapp
pip install -e .
equine-webapp
```


### Run equine-webapp with local Node.js/Next.js and Python/Flask development servers

#### Node.js/Next.js Frontend Development Server
1. Make a copy of `client/.env.example` and rename to `client/.env.local`. This new file should be git-ignored by default.

2. Install node packages and start the development server
```
cd client
npm i
npm run dev
```

##### Frontend testing
```
npm run test
```

#### Python/Flask Development Server

Create a new Anaconda environment, activate it, install the requirements, and start the dev server
```
conda create --name equine-webapp python=3.10
conda activate equine-webapp
pip install -r requirements.txt
python start_dev_server.py
```

##### Python Testing
```
pip install pytest
python -m pytest
```

## Bibliography

```
@INPROCEEDINGS{10360884,
  author={Li, Harry X. and Jorgensen, Steven and Holodnak, John and Wollaber, Allan B.},
  booktitle={2023 IEEE Visualization and Visual Analytics (VIS)}, 
  title={ScatterUQ: Interactive Uncertainty Visualizations for Multiclass Deep Learning Problems}, 
  year={2023},
  volume={},
  number={},
  pages={246-250},
  keywords={Deep learning;Dimensionality reduction;Training;Uncertainty;Visual analytics;Soft sensors;Interactive systems;Uncertainty quantification;Machine learning;Dimensionality reduction;Visualization;Explainable AI},
  doi={10.1109/VIS54172.2023.00058}}
```

## Disclaimer

DISTRIBUTION STATEMENT A. Approved for public release. Distribution is unlimited.

© 2023 MASSACHUSETTS INSTITUTE OF TECHNOLOGY

- Subject to FAR 52.227-11 – Patent Rights – Ownership by the Contractor (May 2014)
- SPDX-License-Identifier: MIT

This material is based upon work supported by the Under Secretary of Defense for Research and Engineering under Air Force Contract No. FA8702-15-D-0001. Any opinions, findings, conclusions or recommendations expressed in this material are those of the author(s) and do not necessarily reflect the views of the Under Secretary of Defense for Research and Engineering.

The software/firmware is provided to you on an As-Is basis.
