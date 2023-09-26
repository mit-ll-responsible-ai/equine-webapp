import { UploadModelDocument, UploadModelMutation, UploadModelMutationVariables, UploadSampleFileDocument, UploadSampleFileMutation, UploadSampleFileMutationVariables } from "@/graphql/generated"
import graphqlMultipartFormFetcher from "./graphqlMultipartFormFetcher"

/**
 * Upload a model and/or sample files to the server in parallel Promises
 * @param uploadModelFile model file to upload, or null
 * @param sampleFiles     array of sample files to upload (can be empty)
 * @returns               result of Promise.all
 */
export default async function uploadModelAndSampleFiles(
  uploadModelFile: File | null,
  sampleFiles: File[],
) {
  const uploadPromises:Promise<any>[] = []

  /* Upload applicable model and sample files */
  const uploadingNewModel = uploadModelFile!==null
  if(uploadingNewModel) { //if we have a model file to upload
    uploadPromises.push( //upload the model file 
      graphqlMultipartFormFetcher<UploadModelMutation, UploadModelMutationVariables>(
        UploadModelDocument, 
        { modelFile: uploadModelFile }
      )()
    )
  }
  sampleFiles.forEach(f => { //upload each sample file
    uploadPromises.push(
      graphqlMultipartFormFetcher<UploadSampleFileMutation, UploadSampleFileMutationVariables>(
        UploadSampleFileDocument, 
        { file: f }
      )()
    )
  })
  return await Promise.all(uploadPromises) //wait for all the upload promises to resolve
}