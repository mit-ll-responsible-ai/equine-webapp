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
    const trackNegativeOODScores:{index:number, score: number}[] = []

    //loop over all the samples to make sure the OOD scores are valid
    samples.map((s,index) => {
      if(s.ood < 0) {
        trackNegativeOODScores.push({index, score: s.ood}) //track the error to display to the user
        s.ood = 0 //force the OOD value to be 0
      }

      //TODO what about class confidence scores?
    })


    //if we need to warn the user about negative OOD scores
    if(trackNegativeOODScores.length > 0) {
      dispatch(showModal({
        body: (
          <div>
            <p>We unexpectedly encountered negative OOD scores, which likely indicates a bug in EQUINE. The webapp is forcing these OOD scores to <code>0</code>, but you should be careful with the results:</p>

            <table style={{width:"100%"}}>
              <thead>
                <tr>
                  <th>Sample Index</th>
                  <th>Original OOD Score</th>
                </tr>
              </thead>

              <tbody>
                {trackNegativeOODScores.map(({index,score}, i) => (
                  <tr key={i}>
                    <td>{index}</td>
                    <td><code>{score}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ),
        canClose: true,
        header: `Warning: encountered negative OOD scores`,
      }))
    }

    dispatch(setSamples(samples))
  }
}