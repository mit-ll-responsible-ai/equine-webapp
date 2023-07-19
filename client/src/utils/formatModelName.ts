// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
/**
 * Right now this function is only used to pretty format the default NN and RF
 * @param load_model_path model name
 * @returns               prettified default NN/RF, else return the model name as is
 */
export default function formatModelName(load_model_path: string) {
  switch (load_model_path) {
    case "default_proto":
      return "Default Protonet"
      case "default_proto_ensemble":
        return "Default Protonet Ensemble"  
    case "default_rf":
      return "Default Random Forest"
    default:
      return load_model_path
  }
}
