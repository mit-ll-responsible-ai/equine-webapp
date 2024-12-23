/**
 * Create a multipart form fetcher for GraphQL to allow multiple files upload
 * Based off this documentation https://github.com/jaydenseric/graphql-multipart-request-spec
 * 
 * @param query     query/mutation string
 * @param variables optional variables
 * @returns         an async function that sends the request and handles the response
 */
export default function graphqlMultipartFormFetcher<TData, TVariables>(
  query: string,
  variables: TVariables
) {
  return async (): Promise<TData> => {
    const body =  createMultipartFormData<TVariables>(query, variables)

    //the rest of the code is mostly copied from the generated graphql fetcher in 
    //client/src/graphql/generated.ts
    const res = await fetch(
      localStorage.getItem('serverUrl')+'/graphql' as string,
      { method:"POST", body }
    )

    const json = await res.json();

    if (json.errors) {
      const { message } = json.errors[0];

      throw new Error(message);
    }

    return json.data;
  }
}

/**
 * Creating a multipart form request is a little tricky since GraphQL normally only accepts JSON strings
 * and files are not JSON compatible, besides base64 encoding which is not efficient. The way to get
 * around this is to:
 * 1) Create a FormData instance
 * 2) Create a "map" variable that maps files to their locations in "variables" using object-key dot 
 * notation, ex "modelFile" or "sampleFiles.0"
 * 3) Replace all the files in "variables" with null placeholders
 * 4) Append the operations ("query" and "variables"), map, and files to the FormData
 * 5) Make a GraphQL request with the FormData as the body
 * 
 * For example, if:
 * const variables = { "modelFile": <File1>, "sampleFiles": [<File2>, <File3>], "testing": 123 }
 * 
 * Then this function will execute something like:
 * const variablesCopy = { "modelFile": null, "sampleFiles": [null, null], "testing": 123 }
 * const map = { "File1": ["variables.modelFile"], "File2": ["variables.sampleFiles.0"], "File3": ["variables.sampleFiles.1"] }

 * formData.append("map", JSON.stringify(map))
 * formData.append("File1", File1)
 * formData.append("File2", File2)
 * formData.append("File3", File3)
 * formData.append("operations", JSON.stringify({query, variables: variablesCopy}))
 * 
 * Note that this function dynamically looks for files only at the top level or in top level arrays.
 * If you want this to look for deeply nested files, you will need to add that functionality.
 * 
 * @param query     graphql query/mutation string 
 * @param variables graphql variables
 * @returns         multipart FormData instance
 */

export function createMultipartFormData<TVariables>(
  query: string,
  variables:TVariables
) {
  const formData = new FormData() //1) Create a FormData instance

  const map:{[key:string]: string[]} = {}
  const variablesCopy:{[key:string]: any} = {}
  for(const key in variables) {
    const value = variables[key]
    if(value instanceof File) { //if the value is a file
      //3) Replace all the files in "variables" with null placeholders
      variablesCopy[key] = null //set the file to a placeholder null
      addFileToMap(formData, map, value, key)
    }
    //else if the value is an array with a first element that is a file
    //assume that this is an array of files
    else if(Array.isArray(value) && value[0] instanceof File) {
      variablesCopy[key] = value.map((f,i) => {
        addFileToMap(formData, map, f, key+"."+i.toString())
        //3) Replace all the files in "variables" with null placeholders
        return null //map the array of files to an array of placeholder nulls
      })
    }
    else { //else this is not a file or array of files
      variablesCopy[key] = value //copy the value as is
    }
  }

  //4) Append the operations ("query" and "variables"), map, and files to the FormData
  formData.append("map",JSON.stringify(map))
  formData.append("operations",JSON.stringify({ query, variables: variablesCopy }))

  return formData
}

/**
 * 2) Create a "map" variable that maps files to their locations in "variables" using object-key dot 
 * notation
 * @param formData  FormData instance
 * @param map       file to location map object
 * @param file      the file to map
 * @param key       the location of the file in "variables" using dot notation
 */
export function addFileToMap(
  formData: FormData,
  map:{[key:string]: string[]},
  file: File,
  key: string,
) {
  if(map[file.name] === undefined) { //if we have not encountered this file yet
    map[file.name] = [] //create a new array for this file name
  }
  map[file.name].push("variables." + key) //push the object key into the array

  //4) Append the operations ("query" and "variables"), map, and files to the FormData
  formData.append(file.name, file) //append the file to the FormData object
}