// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import { GetPrototypeSupportEmbeddingsQuery } from "@/graphql/generated";
import { SampleType } from "@/redux/inferenceSettings";

export default function getLabelsSortedByDistance(
  sample: SampleType,
  prototypeSupportEmbeddings?: GetPrototypeSupportEmbeddingsQuery,
) {
  if(prototypeSupportEmbeddings) {
    return prototypeSupportEmbeddings.getPrototypeSupportEmbeddings.map( //create a shallow copy of the labels
      l => l
    ).map(label => ({ //calculate the distance between this label's prototype and this sample
      label,
      distanceFromSample: getVectorDistance(sample.coordinates, label.prototype)
    })).sort( //sort in ascending distance order
      (a,b) => a.distanceFromSample - b.distanceFromSample
    ).map( //get rid of the distance since we don't need it anymore
      ({label}) => label
    )
  }
  return []
}

/**
 * calculate the distance between two vectors using spread in Math.hypot
 * @param vec1  first vector
 * @param vec2  second vector
 * @returns     the Euclidean distance between these two vectors
 */
function getVectorDistance(vec1:number[], vec2:number[]) {
  if(vec1.length !== vec2.length) throw new Error("Vector lengths did not match")
  return Math.hypot(...vec1.map((value1, idx) => value1 - vec2[idx]))
}
