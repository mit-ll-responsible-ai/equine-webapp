import os
from equine import load_equine_model
import matplotlib.pyplot as plt

model_path = "webapp-output/models/vnat_protonet.eq"
if not os.path.isfile(model_path):
    raise ValueError(f"Model File '{model_path}' not found")

model = load_equine_model(model_path)
support_examples = model.get_support()

df = pd.DataFrame(support_examples[0])

# Create a grid of subplots
nrows = 4
ncols = 4
fig, axes = plt.subplots(nrows=nrows, ncols=ncols, figsize=(12, 4*nrows))

# Flatten axes array if necessary
axes = axes.flatten()

# Create histograms for each column
first_support_example = support_examples[0][0]
for i, column in enumerate(df.columns):
    df[column].hist(ax=axes[i], bins=10, edgecolor='black')
    axes[i].set_title(f'Histogram of column {column}')
    axes[i].set_xlabel(f'Column {column}')
    axes[i].set_ylabel('Frequency')

    value = first_support_example[i]
    axes[i].axvline(value, color='red', linestyle='--', linewidth=2, label=f'Value: {value:.2f}')
    axes[i].legend()

# Turn off any unused subplots
for i in range(len(df.columns), len(axes)):
    axes[i].axis('off')

# Adjust layout
plt.tight_layout()
plt.show()


# TODO think about showing mean +/- STD instead of raw values, or all the histograms