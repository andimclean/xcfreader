# Binary Parser to BinaryReader Migration Guide

## Overview

This document outlines the migration from `binary-parser` to our custom `BinaryReader` implementation for better bundle size, typing, and performance.

## Size Comparison

**Before:**

- binary-parser: ~25-30KB minified in bundle
- ui-xcfimage bundle: 104KB minified

**After (Estimated):**

- BinaryReader: ~2-3KB minified
- ui-xcfimage bundle: **~80-85KB minified** (20-25% reduction)

## API Comparison

### Basic Types

**Before (binary-parser):**

```typescript
const parser = new Parser()
  .uint8("field1")
  .int8("field2")
  .uint32("field3")
  .int32("field4")
  .floatbe("field5")
  .floatle("field6");
```

**After (BinaryReader):**

```typescript
const field1 = reader.readUInt8();
const field2 = reader.readInt8();
const field3 = reader.readUInt32BE();
const field4 = reader.readInt32BE();
const field5 = reader.readFloatBE();
const field6 = reader.readFloatLE();
```

### Strings

**Before:**

```typescript
// Zero-terminated
.string("name", { zeroTerminated: true })

// Fixed length
.string("magic", { length: 9 })
```

**After:**

```typescript
// Zero-terminated
const name = reader.readZeroTerminatedString();

// Fixed length
const magic = reader.readString(9);
```

### Buffers

**Before:**

```typescript
.buffer("data", { length: "fieldLength" })
```

**After:**

```typescript
const data = reader.readBuffer(fieldLength);
```

### Arrays with readUntil

**Before:**

```typescript
.array("layerList", {
  type: "int32be",
  readUntil: (item) => item === 0
})
```

**After:**

```typescript
const layerList = reader.readUInt32ArrayUntil((item) => item === 0);
```

### Complex Arrays

**Before:**

```typescript
.array("propertyList", {
  type: propertyParser,
  readUntil: (item) => item.type === 0
})
```

**After:**

```typescript
const propertyList = reader.readArrayUntil(
  (br) => parseProperty(br),
  (item) => item.type === 0
);
```

## Migration Examples

### Example 1: RGB Parser

**Before:**

```typescript
const rgbParser = new Parser().uint8("red").uint8("green").uint8("blue");
```

**After:**

```typescript
interface RGB {
  red: number;
  green: number;
  blue: number;
}

function parseRGB(reader: BinaryReader): RGB {
  return {
    red: reader.readUInt8(),
    green: reader.readUInt8(),
    blue: reader.readUInt8(),
  };
}
```

### Example 2: Property with Length

**Before:**

```typescript
const prop_modeParser = new Parser().uint32("length", { assert: 4 }).uint32("mode");
```

**After:**

```typescript
interface ModeProp {
  length: number;
  mode: number;
}

function parseModeProp(reader: BinaryReader): ModeProp {
  const length = reader.readUInt32BE();
  if (length !== 4) {
    throw new XCFParseError(`Expected length 4, got ${length}`);
  }
  const mode = reader.readUInt32BE();
  return { length, mode };
}
```

### Example 3: Choice/Switch Parser

**Before:**

```typescript
.choice("data", {
  tag: "type",
  choices: {
    [XCF_PropType.MODE]: modParser,
    [XCF_PropType.OPACITY]: opacityParser,
  },
  defaultChoice: defaultParser
})
```

**After:**

```typescript
function parsePropertyData(reader: BinaryReader, type: number): PropertyData {
  switch (type) {
    case XCF_PropType.MODE:
      return parseModeProp(reader);
    case XCF_PropType.OPACITY:
      return parseOpacityProp(reader);
    default:
      return parseDefaultProp(reader);
  }
}
```

### Example 4: XCF Header V10

**Before:**

```typescript
const gimpHeaderV10 = new Parser()
  .endianess("big")
  .string("magic", { length: 9 })
  .string("version", { length: 4 })
  .int8("padding", { assert: 0 })
  .uint32("width")
  .uint32("height")
  .uint32("base_type")
  .array("propertyList", {
    type: propertyListParser,
    readUntil: (item) => item.type === 0,
  })
  .array("layerList", {
    type: "int32be",
    readUntil: (item) => item === 0,
  });
```

**After:**

```typescript
interface GimpHeaderV10 {
  magic: string;
  version: string;
  padding: number;
  width: number;
  height: number;
  base_type: number;
  propertyList: ParsedProperty[];
  layerList: number[];
}

function parseGimpHeaderV10(reader: BinaryReader): GimpHeaderV10 {
  const magic = reader.readString(9);
  const version = reader.readString(4);
  const padding = reader.readInt8();

  if (padding !== 0) {
    throw new XCFParseError(`Expected padding 0, got ${padding}`);
  }

  const width = reader.readUInt32BE();
  const height = reader.readUInt32BE();
  const base_type = reader.readUInt32BE();

  const propertyList = reader.readArrayUntil(
    (br) => parseProperty(br),
    (item) => item.type === 0
  );

  const layerList = reader.readUInt32ArrayUntil((item) => item === 0);

  return {
    magic,
    version,
    padding,
    width,
    height,
    base_type,
    propertyList,
    layerList,
  };
}
```

## Benefits

### 1. Better TypeScript Types

```typescript
// Before: generic parser types
const result = gimpHeaderV10.parse(buffer); // result is 'any'

// After: strongly typed
const result = parseGimpHeaderV10(reader); // result is GimpHeaderV10
```

### 2. Smaller Bundle

- Only includes what we use
- No parser construction overhead
- Tree-shakeable functions

### 3. Better Performance

- No parser object creation
- Direct Buffer API calls
- No intermediate object allocation
- Streaming read pattern

### 4. Better Error Messages

- Custom error messages per field
- Context-aware validation
- Stack traces point to actual parsing code

## Migration Strategy

1. ✅ Create `src/lib/binary-reader.ts`
2. Create parser functions in `src/lib/xcf-parsers.ts`
3. Update `gimpparser.ts` to use new parsers
4. Run full test suite
5. Measure bundle size reduction
6. Remove binary-parser dependency

## Estimated Effort

- Initial setup: 1-2 hours
- Migration: 3-4 hours
- Testing: 1 hour
- **Total: 5-7 hours**

## Risk Assessment

**Low Risk** because:

- ✅ Comprehensive test suite already exists
- ✅ Tests use real XCF files
- ✅ Can migrate incrementally (keep binary-parser during migration)
- ✅ BinaryReader is simple and testable
- ✅ Existing tests will catch any regressions
