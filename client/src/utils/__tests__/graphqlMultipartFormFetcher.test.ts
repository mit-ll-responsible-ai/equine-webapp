import graphqlMultipartFormFetcher, { 
  createMultipartFormData, 
  addFileToMap 
} from "../graphqlMultipartFormFetcher"

//TODO test graphqlMultipartFormFetcher

describe("createMultipartFormData", () => {
  it("creates a well formed FormData instance with top level files and files in arrays", () => {
    const file1 = new File([],"test_file_1.txt")
    const file2 = new File([],"test_file_2.txt")
    const file3 = new File([],"test_file_3.txt")
    
    const query = "query MyQuery { test }"
    const variables = {
      "modelFile": file1, 
      "sampleFiles": [file2, file3], 
      "testing": 123,
      "myString": "abc",
      "myBool": true
    }

    const formData = createMultipartFormData(query, variables)

    //the files are appended properly
    expect(formData.get(file1.name)).toEqual(file1)
    expect(formData.get(file2.name)).toEqual(file2)
    expect(formData.get(file3.name)).toEqual(file3)

    //the map is appended properly
    expect(formData.get("map")).toEqual(JSON.stringify({
      [file1.name]: ["variables.modelFile"],
      [file2.name]: ["variables.sampleFiles.0"],
      [file3.name]: ["variables.sampleFiles.1"]
    }))

    //the operations is appended properly
    expect(formData.get("operations")).toEqual(JSON.stringify({
      query,
      variables: {
        "modelFile": null, 
        "sampleFiles": [null, null], 
        "testing": 123,
        "myString": "abc",
        "myBool": true
      }
    }))
  })
})

describe("addFileToMap", () => {
  test("addFileToMap one file, second file, duplicate file", () => {
    const formData = new FormData()
    const map = {}

    // test adding one file
    const file1 = new File([],"test_file_1.txt")
    const key1 = "test_key_1"

    addFileToMap(formData, map, file1, key1)

    expect(formData.get(file1.name)).toEqual(file1)
    expect(map).toEqual({[file1.name]: ["variables."+key1]})

    // test adding a second file
    const file2 = new File([],"test_file_2.txt")
    const key2 = "test_key_2"

    addFileToMap(formData, map, file2, key2)

    expect(formData.get(file1.name)).toEqual(file1)
    expect(formData.get(file2.name)).toEqual(file2)
    expect(map).toEqual({
      [file1.name]: ["variables."+key1],
      [file2.name]: ["variables."+key2],
    })

    //test adding a duplicate file, ie add file1 again
    const key3 = "test_key.0"
    addFileToMap(formData, map, file1, key3)

    expect(formData.get(file1.name)).toEqual(file1)
    expect(formData.get(file2.name)).toEqual(file2)
    expect(map).toEqual({
      [file1.name]: ["variables."+key1, "variables."+key3],
      [file2.name]: ["variables."+key2],
    })
  })
})