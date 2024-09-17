import { SampleType, setSamples } from "@/redux/inferenceSettings";
import { showModal } from "@/redux/modal";
import { useDispatch } from "react-redux";

type InvalidScoreTrackerType = {
  index:number, 
  label:string, 
  score: number, 
  type: "negative OOD"|"greater than 1 OOD"|"negative class confidence"
  |"greater than 1 class confidence"|"non 1 class confidence sum"
}

/**
 * This hook processes the OOD and class confidence scores to make sure they are valid,
 * and displays an error message in the model if they are not.
 * It also sets the data in redux.
 * @returns a function that processes and sets the samples in redux state
 */
export function useProcessAndSetSamples() {
  const dispatch = useDispatch()
  
  return (samples: SampleType[]) => {
    const invalidScores: InvalidScoreTrackerType[] = []

    //loop over all the samples to make sure the scores are valid
    samples.forEach((s,index) => {
      //check that the OOD values make sense
      if(s.ood < 0) {
        invalidScores.push({index, label:"", score: s.ood, type: "negative OOD"})
        s.ood = 0 //force the OOD value to be 0
      }
      else if(s.ood > 1) {
        invalidScores.push({index, label:"", score: s.ood, type: "greater than 1 OOD"})
        s.ood = 1 //force the OOD value to be 1
      }

      //check that the class confidence values make sense
      let classConfidenceSum = 0
      Object.entries(s.classProbabilities).map(([label, value]) => {
        classConfidenceSum += value //sum the class confidence scores

        if(value < 0) {
          invalidScores.push({index, label, score: value, type: "negative class confidence"})
          s.classProbabilities[label] = 0 //force the class score to be 0
        }
        else if(value > 1) {
          invalidScores.push({index, label, score: value, type: "greater than 1 class confidence"})
          s.classProbabilities[label] = 1 //force the class score to be 1
        }
      })

      //if the class confidence scores don't sum close to 1, record an error
      if(classConfidenceSum<0.99 || classConfidenceSum>1.01) {
        invalidScores.push({index, label:"", score: classConfidenceSum, type: "non 1 class confidence sum"})
      }
    })


    //if we need to warn the user about invalid scores
    if(invalidScores.length > 0) {
      dispatch(showModal({
        body: (
          <div>
            <RenderInvalidScoresError
              errorMessage={<p>We unexpectedly encountered negative OOD scores, which likely indicates a bug in EQUINE. The webapp is forcing these OOD scores to <code>0</code>, but you should be careful with the results:</p>}
              invalidScores={invalidScores.filter(e => e.type==="negative OOD")}
              newScore={<code>0</code>}
              showLabel={false}
              valueColumnHeading="Original OOD Score"
            />

            <RenderInvalidScoresError
              errorMessage={<p>We unexpectedly encountered OOD scores greater than <code>1</code>, which likely indicates a bug in EQUINE. The webapp is forcing these class confidence scores to <code>1</code>, but you should be careful with the results:</p>}
              invalidScores={invalidScores.filter(e => e.type==="greater than 1 OOD")}
              newScore={<code>1</code>}
              showLabel={true}
              valueColumnHeading="Original OOD Score"
            />

            <RenderInvalidScoresError
              errorMessage={<p>We unexpectedly encountered negative class confidence scores, which likely indicates a bug in EQUINE. The webapp is forcing these class confidence scores to <code>0</code>, but you should be careful with the results:</p>}
              invalidScores={invalidScores.filter(e => e.type==="negative class confidence")}
              newScore={<code>0</code>}
              showLabel={true}
              valueColumnHeading="Original Class Confidence Score"
            />

            <RenderInvalidScoresError
              errorMessage={<p>We unexpectedly encountered class confidence scores greater than <code>1</code>, which likely indicates a bug in EQUINE. The webapp is forcing these class confidence scores to <code>1</code>, but you should be careful with the results:</p>}
              invalidScores={invalidScores.filter(e => e.type==="greater than 1 class confidence")}
              newScore={<code>1</code>}
              showLabel={false}
              valueColumnHeading="Original Class Confidence Score"
            />

            <RenderInvalidScoresError
              errorMessage={<p>We unexpectedly encountered class confidence scores that do not sum to <code>1</code>, which likely indicates a bug in EQUINE. You should be careful with the results:</p>}
              invalidScores={invalidScores.filter(e => e.type==="non 1 class confidence sum")}
              showLabel={false}
              valueColumnHeading="Sum of Class Confidence Scores"
            />
          </div>
        ),
        canClose: true,
        header: `Warning: Encountered Invalid Prediction Scores`,
      }))
    }

    dispatch(setSamples(samples))
  }
}


function RenderInvalidScoresError({
  errorMessage,
  invalidScores,
  newScore,
  showLabel,
  valueColumnHeading,
}:{
  errorMessage: React.ReactNode,
  invalidScores: InvalidScoreTrackerType[],
  newScore?: React.ReactNode,
  showLabel: boolean,
  valueColumnHeading: string,
}) {
  if(invalidScores.length === 0) return null

  return (
    <>
      {errorMessage}

      <table style={{width:"100%"}}>
        <thead>
          <tr>
            <th>Sample Index</th>
            {showLabel && <th>Label</th>}
            <th>{valueColumnHeading}</th>
            {newScore && <th>New Score</th>}
          </tr>
        </thead>

        <tbody>
          {invalidScores.map(({index,label,score}, i) => (
            <tr key={i}>
              <td>{index}</td>
              {showLabel && <td>{label}</td>}
              <td><code>{score}</code></td>
              {newScore && <td>{newScore}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      <hr/>
    </>
  )
}