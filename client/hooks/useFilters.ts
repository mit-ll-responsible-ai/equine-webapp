// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
import { useEffect, useState } from "react"
import { ClassProbabilitiesType } from "@/redux/inferenceSettings"

export default function useFilters(labels: string[]) {
  const [filters, setFilters] = useState<string[]>([])

  //if the labels change, select all the filters
  useEffect(() => { setFilters([...labels]) }, [labels])

  const toggleFilter = (label:string) => {
    if(label) {
      const set = new Set(filters)
      if(set.has(label)) {
        set.delete(label)
      }
      else {
        set.add(label)
      }
      setFilters(Array.from(set))
    }
  }

  return { filters, setFilters, toggleFilter }
}

export const sampleMatchesFilters = (filters:string[],processedClassProbabilities:ClassProbabilitiesType) => {
  //check if this sample has any matching labels
  for(const label of filters) { //for all the labels in the filter
    if(processedClassProbabilities[label] === 1) { //if this sample has a matching label
      return true
    }
  }
  return false
}