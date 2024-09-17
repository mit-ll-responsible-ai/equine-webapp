// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import { GetPrototypeSupportEmbeddingsQuery } from "@/graphql/generated";
import { SampleType } from "@/redux/inferenceSettings";

export default function getLabelsSortedByProbability(
  sample: SampleType,
  prototypeSupportEmbeddings?: GetPrototypeSupportEmbeddingsQuery,
) {
  if(prototypeSupportEmbeddings) {
    return prototypeSupportEmbeddings.getPrototypeSupportEmbeddings.map( //create a shallow copy of the labels
      l => l
    ).sort( //sort in descending probability order
      (a,b) => sample.classProbabilities[b.label] - sample.classProbabilities[a.label]
    )
  }
  return []
}
