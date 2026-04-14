import { GetPrototypeSupportEmbeddingsQuery } from "@/graphql/generated"
import { SAMPLE_CONDITIONS } from "@/utils/determineSampleCondition"

export function SampleConditionText({
  condition,
  sortedLabels,
}:{
  condition: SAMPLE_CONDITIONS,
  sortedLabels: GetPrototypeSupportEmbeddingsQuery["getPrototypeSupportEmbeddings"],
}) {
  if(sortedLabels.length === 0) return null
  
  const closestClass = sortedLabels[0].label
  switch (condition) {
    case SAMPLE_CONDITIONS.IN_DISTRO_CONFIDENT:
      return <p>Based on your selected thresholds, the model is confident that this sample is in distribution and of class <code>{closestClass}</code> because it is closest to the <code>{closestClass}</code> prototype and lands in the middle of other <code>{closestClass}</code> training examples.</p>
    case SAMPLE_CONDITIONS.CLASS_CONFUSION:
      const secondClass = sortedLabels[1].label

      return <p>Based on your selected thresholds, the model is confident that this sample is in distribution but not confident about its class. The sample lands between the <code>{closestClass}</code> and <code>{secondClass}</code> prototypes and training examples. As an ML Consumer, you should be careful using the class prediction and make the final determination. As an ML Engineer, you may need additional training data or refactor your labels.</p>
    default: //SAMPLE_CONDITIONS.OOD
      return <p>Based on your selected thresholds, the model thinks this sample is out of distribution because the sample lands far away from the other training examples in the high dimensional latent space. It lands closest to the <code>{closestClass}</code> prototype. As an ML Consumer, you should be careful using the class prediction and make the final determination. As an ML Engineer, you may be able to recognize the introduction of a new class label.</p>
  }
}