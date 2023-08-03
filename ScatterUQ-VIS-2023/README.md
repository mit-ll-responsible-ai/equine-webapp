# ScatterUQ VIS 2023

This folder contains our raw data, analysis script, and output data.

## `uq_viz_data`

This folder contains the raw data for 10 sets of randomly generated training examples for each class. Because the training examples are selected randomly at test time, we tried to account for statistical variance by averaging results of this set of training examples.

## `calc_dr_metrics.py`

This is our analysis script that calculated the dimensionality reduction metrics for our paper. For performance reasons for t-SNE and UMAP, we randomly sample points for the global plot, which leads to slightly varying results on every run.

## `dr_metrics.txt`

This is our output data file that we used to publish results in our paper.