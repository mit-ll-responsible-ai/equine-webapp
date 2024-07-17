import { SampleType, setSamples } from "@/redux/inferenceSettings";
import { showModal } from "@/redux/modal";
import { useDispatch } from "react-redux";

/**
 * This hook processes the OOD scores to make sure they're not negative,
 * and displays an error message in the model if they are.
 * It also sets the data in redux.
 * @returns a function that processes and sets the samples in redux state
 */
export function useProcessAndSetSamples() {
  const dispatch = useDispatch()
  
  return (samples: SampleType[]) => {
    samples.map((s,i) => {
      if(s.ood < 0) {
        dispatch(showModal({
          body: `Encountered a negative OOD score of ${s.ood} in sample index ${i}. This likely indicates a bug in EQUINE. The webapp is setting these OOD scores to 0, but you should be careful with the results.`,
          canClose: true,
          header: `Warning: encountered a negative OOD score `,
        }))
  
        s.ood = 0
      }
    })
    dispatch(setSamples(samples))
  }
}