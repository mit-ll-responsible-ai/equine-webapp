// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
/**
 * sorting comparator used to dynamically sort an array of objects
 * @param  {Array}        an array of objects in the format [{field:string, direction:number},...]
 * @return {Number}       -1 (less than), 0 (equal), or 1 (greater than)
 */
function comparator(sorts:{field:string, direction?:number}[]) {
  //only consider the first sort (if two elements are equal, recursively consider subsequent sorts)
  const firstSort = sorts[0]
  return function(a:any,b:any):number {
    if (dotTraverse(a,firstSort.field) < dotTraverse(b,firstSort.field)) {return -1*(firstSort.direction || 1);}
    if (dotTraverse(a,firstSort.field) > dotTraverse(b,firstSort.field)) {return (firstSort.direction || 1);}
    if(sorts[1] !== undefined) {return comparator(sorts.slice(1,sorts.length))(a,b);} //these elements are equal, if there are more sorts, recursively consider subsequent sort
    return 0; //we ran out of sorts to consider so these elements are equal
  }
}

/**
 * JS doesn't support accessing nested object values using a simple string
 * this function allows you to taverse an object with a key string separated by dots to return a lower level value in a nested object
 * ex: obj = {field: {length: value}}; dotTraverse(obj, "field.length") returns value
 * this allows you to dotTraverse a nested or multi-leveled object with a key string in dot notation such as "field.length", since normally trying to access fields that are lower in the hierarchy with dot notation doesn't work
 * ex obj["field.length"] doesn't search for lower level fields obj = {field: {length: value}} but instead searches for a top level field obj = {'field.length': value}
 * @param  {Object} obj                 a normal JavaScript object that you are trying to dotTraverse
 * @param  {String} dotNotationString   string of object fields separated using dot notation, ex: "field1.field2.etc"
 * @return {Any}                        [the nested value in the object we're looking for using dot notation]
 */
function dotTraverse(obj:{[key:string]: any}, dotNotationString:string) {
  //split the dotNotationString by dots into a array of strings
  //using the reduce function starting with object, access the values in the nested object one key at a time, eventually returning the desired lower level value
  return dotNotationString.split('.').reduce(function (cur, key) {
    return cur[key];
  }, obj);
};


export default comparator
