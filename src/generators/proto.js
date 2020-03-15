import capitalize from 'capitalize'
import {getTypes} from '../index'

export const description = 'Generate Protobuf types from your data'

export const options = yargs => {
  yargs.example('$0 proto User ./users/*.json', 'Make a type called User from a bunch of JSON files.')
}

const typeMap = {
  int: 'int32',
  float: 'float',
  string: 'string',
  boolean: 'bool',
  null: 'google.protobuf.NullValue'
}

const importingTypes = ['null']

export const makeType = (name, types) => {
  let hasImportedTypes = false

  const others = []
  const messageStruct = `message ${name} {
  ${Object.keys(types).map((t, i) => {
    const jsonType = types[t]
    
    if (typeof jsonType === 'string') {
      hasImportedTypes = hasImportedTypes || (importingTypes.indexOf(jsonType) !== -1)
      
      return `${typeMap[jsonType]} ${t} = ${i + 1};`
    } else {
      if (Array.isArray(jsonType)) {
        return `repeated ${typeMap[jsonType[0]]} ${t} = ${i + 1};`
      } else {
        others.push(makeType(`${capitalize(name)}${capitalize(t)}`, jsonType))
        return `${capitalize(name)}${capitalize(t)} ${t} = ${i + 1};`
      }
    }
  }).join('\n  ')}
}
` + others.join('')

  const protobuf = [
    'syntax = "proto3";',
    hasImportedTypes ? 'import "google/protobuf/struct.proto";' : '',
    messageStruct
  ].filter(value => value.trim()).join("\n\n")

  return protobuf
}

export const run = ({ MODEL, data }) => {
  const types = getTypes(Object.values(data))
  return makeType(MODEL, types)
}
