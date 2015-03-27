/// <reference path="typings/tsd.d.ts" />
"use strict";
import stream = require('stream');
import _ = require('lodash');
import DojoDetailsInterface = require('./DojoDetailsInterface');
import he = require('he');

type DojoDetailsInterface = DojoDetailsInterface.DojoDetailsInterface;
type DojoNamespace = DojoDetailsInterface.DojoNamespace;
type DojoProperty = DojoDetailsInterface.DojoProperty;
type DojoMethod = DojoDetailsInterface.DojoMethod;
type DojoParameter = DojoDetailsInterface.DojoParameter;
type DojoDocumentedEntity = DojoDetailsInterface.DojoDocumentedEntity;

function log(...data: string[]): void {
  console.log(data.join(" "));
}

function indent(level: number): string {
  "use strict";
  let result = "";
  for (let i=0; i<level; i++) {
    result += "  ";
  }
  return result;
}

function logRef(msg: string, namespace: DojoNamespace): void {
  log(`    ${msg} [${namespace.location}](http://dojotoolkit.org/api/?qs=1.10/${namespace.location})`); 
}

export function formatAPI(details: DojoDetailsInterface): string {
  let result = "";
  for (let key in details) {
    const patched = patchModuleNamespace(details[key]);
    if (patched !== null) {
      result += formatModule(patched);
    }
  }
  return result;
}

const FORCED_INTERFACE_REGEX = [
  /^dojo\/store\/api\//,
  /^dojo\/data\/api\//,
  /^dojo\/number\.__/,
  /^Error$/
];

function isDojoInterface(from: string, name: string = null): boolean {
  // Types which start with __ are Dojo's (fake) way of documenting interfaces.
  if (isForcedNamespace(from)) {
    return false;
  }
  const parts = normalizeName(from).split(/\./g);
  const lastPart = parts[parts.length-1];
  return lastPart.indexOf("__") === 0 || FORCED_INTERFACE_REGEX.some( (re) => re.test(from) ) || (name !== null && name.indexOf("__")===0);
}

const FORCED_CLASS_REGEX = [
  /^dojo\/NodeList$/
];

const FORCED_NAMESPACE_REGEX = [
  /^dojo\/ready$/,
  /^dojo\/domReady$/,
  /^dojo\/debounce$/,
  /^dojo\/hccss$/,
  /^dojo\/on\/asyncEventListener$/,
  /^dojo\/on\/debounce$/,
  /^dojo\/on\/throttle$/,
  /^dojo\/throttle$/,
  /^dojo\/promise\/instrumentation$/
];

function isForcedNamespace(from: string): boolean {
  return FORCED_NAMESPACE_REGEX.some( (re) => re.test(from) );
}

function isDojoClass(namespace: DojoNamespace): boolean {
  // return namespace.methods !== undefined && namespace.methods.some( (m) => m.name === 'constructor');
  const name = namespace.location;
  if (isForcedNamespace(namespace.location)) {
    return false;
  }
  const forced = FORCED_CLASS_REGEX.some( (re) =>re.test(name) );
  return namespace.classlike === true || (namespace.type === 'function'
    && (namespace.returnTypes === undefined || namespace.returnTypes.length===0)
    && namespace.methods !== undefined && namespace.methods.length !== 0) || forced;
}

function formatModule(namespace: DojoNamespace, level: number=0): string {
  let result = "";
  let resultTail = "";

  /*log("Location: " + namespace.location + "\n");*/
  const name = namespace.location;
  const parts = normalizeName(name).split(/\./g);
  const lastPart = parts[parts.length-1];

  result += "// Types for " + namespace.location + "\n";

  if (isDojoInterface(namespace.location)) {
    logRef("interface", namespace);
    result += formatModuleInterface(namespace, level);
    
  } else if (isDojoClass(namespace)) {
    logRef("class", namespace);
    result += formatModuleClass(namespace, level);
        
  } else {
    logRef("namespace", namespace);
    const formattedTypes = formatNamespaceTypes(namespace, level);
    if (formattedTypes !== "") {
      // Start nested modules and type definitions.
      parts.forEach( (p) => {
          result += indent(level) + (level === 0 ? "declare " : "") + "module " + p + " {\n";
          resultTail = indent(level) + "}\n" + resultTail;
          level++;
        });
      result += formattedTypes;
      result += resultTail;
    }
    
    // Output the module definition.
    result += formatDocs(namespace, 0);
    result += 'declare module "' + namespace.location + '" {\n';
    result += formatNamespaceFunctions(namespace, 1);

    if (namespace.type === "function") {
      result += indent(1) + "var default_export: {\n";
      let returnTypesString = formatReturnTypes(namespace.returnTypes);
      result += formatParameters(namespace.parameters).map(
        (paramsStr) => indent(2) + "(" +  paramsStr + "): " + returnTypesString + ";\n").join("");
      result += indent(1) + "};\n";
      result += indent(1) + "export=default_export;\n";
    }

    result += "}\n";
    result += "\n";
  }

  return result;
}

function formatNamespaceTypes(namespace: DojoNamespace, level: number): string {
  let result = "";
  
  // FIXME
  return result;
}

function formatNamespaceFunctions(namespace: DojoNamespace, level : number): string {
  let result = "";
  if (namespace.methods !== undefined) {
    namespace.methods.forEach( (method) => {
      if (method.name.indexOf("-") !== -1) {
        result += "// Skipping function with illegal name '" + method.name + "'\n";
      } else {
        result += formatDocs(method, level);
        let returnTypesString = formatReturnTypes(method.returnTypes);
        result += formatParameters(method.parameters).map(
          (paramsStr) => indent(level) + "function " + method.name + "(" +  paramsStr + "): " + returnTypesString + ";\n").join("");
        result += "\n";
      }
    });
  }
  return result;  
}

function formatModuleInterface(namespace: DojoNamespace, level: number): string {
  let result = "";
  let resultTail = "";
  const name = namespace.location;
  const parts = normalizeName(name).split(/\./g);
  const shortName = parts[parts.length-1];
  
  parts.slice(0, -1).forEach( (p) => {
      result += indent(level) + (level === 0 ? "declare " : "") + "module " + p + " {\n";
      resultTail = indent(level) + "}\n" + resultTail;
      level++;
    });
    
  result += formatInterface(namespace, level);
  
  result += resultTail;
  
  result += formatDocs(namespace, 0);
  result += 'declare module "' + namespace.location + '" {\n';
  result += formatInterface(namespace, 1);
  result += indent(1) + "export=" + shortName + ";\n";
  result += "}\n";
  result += "\n";
    
  return result;
}

function formatInterface(namespace: DojoNamespace, level: number): string {
  let result = "";
  let resultTail = "";
  const name = namespace.location;
  const parts = normalizeName(name).split(/\./g);
  const shortName = parts[parts.length-1];
  
  result += indent(level) + "interface " + translateInterfaceName(shortName) + " {\n";
  resultTail += "\n";  
  resultTail = indent(level) + "}" + resultTail;

  level++;
  if (namespace.properties !== undefined) {
    result += formatProperties(namespace.properties, level);
  }

  if (namespace.methods !== undefined) {
    result += formatMethods(namespace.methods, level);
  }
  result += resultTail;

  return result;
}

function formatModuleClass(namespace: DojoNamespace, level: number): string {
  let result = "";
  let resultTail = "";
  const name = namespace.location;
  const parts = normalizeName(name).split(/\./g);
  const shortName = parts[parts.length-1];
  
  parts.slice(0, -1).forEach( (p) => {
      result += indent(level) + (level === 0 ? "declare " : "") + "module " + p + " {\n";
      resultTail = indent(level) + "}\n" + resultTail;
      level++;
    });
    
  result += formatDocs(namespace, level);
  result += formatClass(namespace, level);
  
  result += resultTail;
  
  result += 'declare module "' + namespace.location + '" {\n';

  result += indent(1) + "var _module_class_: typeof " + normalizeName(name) +";\n";
  result += indent(1) + "export=_module_class_;\n";
  
  result += "}\n";
  result += "\n";
    
  return result;
}

function formatFunction(namespace: DojoNamespace, level: number): string {
  let result = "";
  let resultTail = "";
  const name = namespace.location;
  const parts = normalizeName(name).split(/\./g);

  result += formatDocs(namespace, level);
  result += indent(level) + "interface " + translateInterfaceName(parts[parts.length-1]) + " {\n";
  resultTail = indent(level) + "}\n" + resultTail;

  level++;
  let returnTypesString = formatReturnTypes(namespace.returnTypes);
  result += formatParameters(namespace.parameters).map(
    (paramsStr) => indent(level) + "(" +  paramsStr + "): " + returnTypesString + ";\n").join("");

  return result + resultTail;
}

function formatClass(namespace: DojoNamespace, level: number): string {
  let result = "";
  let resultTail = "";
  const name = namespace.location;
  const parts = normalizeName(name).split(/\./g);

  result += indent(level) + "class " + translateInterfaceName(parts[parts.length-1]);
  if (namespace.superclass !== undefined && namespace.superclass !== "") {
    if (isDojoInterface(namespace.superclass)) {
      result += " implements " + formatType(namespace.superclass);
    } else {
      result += " extends " + formatType(namespace.superclass);
    }
  }
  result += " {\n";
  resultTail = indent(level) + "}\n" + resultTail;

  level++;

  result += formatParameters(namespace.parameters).map( (paramStr) => indent(level) + "constructor(" +  paramStr + ");\n" ).join("");
  
  if (namespace.properties !== undefined) {
    result += formatProperties(namespace.properties, level);
  }

  if (namespace.methods !== undefined) {
    result += formatMethods(namespace.methods, level);
  }

  return result + resultTail;
}

export function normalizeName(name: string): string {
  return name.replace(/\//g, ".").replace(/-/g, "_");
}

function translateInterfaceName(name: string): string {
  const underscoreList: string[] = ["string", "default", "number"];
  const parts = name.split("/");
  if (underscoreList.indexOf(parts[parts.length-1]) !== -1) {
    parts[parts.length-1] += "_";
  }

  return parts.join(".").replace(/[-]/g, "_");
}

function formatProperties(properties: DojoProperty[], level: number): string {
  return properties.map( (prop) => indent(level) + prop.name + (prop.usage === "optional" ? "?" : "") + ": " +
    formatTypes(prop.types) + ";\n\n").join("");
}

function formatMethods(methods: DojoMethod[], level: number): string {
  return methods.filter( (m) => !isDojoInterface(m.from, m.name)  ).map( (method) => formatMethod(method, level)).join("\n");
}

function formatMethod(method: DojoMethod, level: number): string {
  let result = formatDocs(method, level);
  result += formatParameters(method.parameters).map(
    (paramStr) => indent(level) + quoteName(method.name) + "(" + paramStr + ")" +
      (method.name !== 'constructor' ? (": " + formatTypes(method.returnTypes)) : "") + ";\n").join("");
  return result;
}

function quoteName(name: string): string {
  if (name.indexOf("-") !== -1) {
    return '"' + name + '"';
  } else {
    return name;
  }
}

function formatDocs(entity: DojoDocumentedEntity, level: number): string {
  let result = indent(level) + "/**\n";
  const docIndent = indent(level) + " * ";
  if (entity.summary !== undefined) {
    result += prefixLines(htmlToPlainLines(entity.summary), docIndent).join("\n") + "\n";
  }
  if (entity.description !== undefined) {
    result += prefixLines(htmlToPlainLines(entity.description), docIndent).join("\n") + "\n";
  }
  result += docIndent + "\n";
  if (entity.parameters !== undefined) {
    result += entity.parameters.map(
      (param) => docIndent + "@param " + param.name + " " +
        (param.usage === "optional" ? "Optional. " : "") +
        (param.summary !== undefined ? htmlToPlainLines(param.summary).join("\n" + docIndent + "          ") + "\n" : "\n")).join("");
  }
  result += indent(level) + " */\n";
  return result;
}

function htmlToPlainLines(text: string): string[] {
  const parts = he.decode(text).split("\n");
  const result = parts.map( (t) => t.trim() ).filter( (t) => t !== "").map(stripHtml);
  if (result.length !==0 && result[result.length-1] === "") {
    result.splice(result.length-1, 1);
  }
  return result;
}

function stripHtml(text: string): string {
  return text.replace(/<p>/g, "").replace(/<\/p>/g, "");
}

function prefixLines(lines: string[], prefix: string): string[] {
  return lines.map( (line) => prefix + line);
}

/**
 * Formats a list of parameters
 *
 * If there are optional parameters in the list which appear before required
 * parameters, then multiple overloaded parameter strings are returned.
 *
 * @param parameters parameters to format
 * @return list of formatted parameter strings.
 */
function formatParameters(parameters: DojoParameter[]): string[] {
  
  if (parameters === undefined) {
    return [""];
  }
  
  let result: string[] = [];
  
  // Sometimes we have to emit a method multiple times with slightly
  // different parameters to support Dojo's habit of sometime having
  // optional parameters which appear before a required parameter.
  
  // Figure out how many optional parameters we have in weird positions.
  let hitLastNonOptional = false;
  let weirdOptionals = 0;
  for (let i = parameters.length-1; i>=0; i--) {
    if ( ! hitLastNonOptional) {
      // Keep looking for the last nonoptional parameter.
      if (parameters[i].usage !== "optional") {
        hitLastNonOptional = true;
      }
    } else {
      if (parameters[i].usage === "optional") {
        weirdOptionals++;
      }
    }
  }
  
  let range = 1 << weirdOptionals;
  for (let i=0; i<range; i++) {
    let optionalCount = 0;
    let mask = i;
    let comma = "";
    let line = "";
    
    parameters.forEach( (parameter) => {
      
      if (optionalCount < weirdOptionals) {
        // We may encounter weird optionals which need special handling.
        if (parameter.usage === "optional") {
          optionalCount++;
          if ((mask & 1) === 1) {
            // Suppress this weird optional.
            mask = mask >> 1;
            return;
          }
          mask = mask >> 1;
        }
        
        // Print this optional parameter but hide its optional flag.
        line += comma;
        comma = ", ";
        line += parameter.name + ": " + formatTypes(parameter.types);
      } else {
        
        // Normal optional processing.
        line += comma;
        comma = ", ";
        line += parameter.name;
        if (parameter.usage === "optional") {
          line += "?";
        }
        line += ": " + formatTypes(parameter.types);
      }
    });
    result.push(line);
  }
    
  return result;
}

function formatReturnTypes(types: string[]): string {
  return formatTypes( types.filter( (t) => t !== "undefined" ) );
}

function formatTypes(types: string[]): string {
  if (types === undefined || types.length === 0) {
    return "any";
  } else {
    if (types.length === 1) {
      return formatType(types[0]);
    } else {
      var mappedTypes = types.map(formatType);
      var seen: Object = new Object();
      var dedupedTypes: string[] = [];
      mappedTypes.forEach( (name) => {
          if ( ! (name in seen) ) {
            dedupedTypes.push(name);
            seen[name] = true;
          }
        });

      return dedupedTypes.reduce( (prev, t) => prev + "|"+ t);
    }
  }
}

/**
 * Patches namespace objects
 *
 * Creates new patched namespace object. This is one place where manual
 * patches and fixes to the Dojo API can be done.
 *
 * @return the corrected namespace object. The original namespace object is
 *              not modified, a copy may be returned.
 */
function patchModuleNamespace(originalNamespace: DojoNamespace): DojoNamespace {
  const name = originalNamespace.location;
  let namespace: DojoNamespace = originalNamespace;
  
  if (name.indexOf("dijit/") === 0) {
    if (containsProperty(namespace, "aria-label") || containsProperty(namespace, "accept-charset")) {
      namespace = deleteProperties(namespace, ["aria-label", "accept-charset"]);
    }
    if (containsMethod(namespace, "|")) {
      namespace = deleteMethods(namespace, ["|"]);
    }
  }
  
  switch(name) {
    case "dojo/dnd/Container":
      namespace = <DojoNamespace> _.cloneDeep(namespace);
      // Remove the pesky insertNodes() method is redined in subclasses with different and incompatible args.
      namespace.methods = namespace.methods.filter( (m) => m.name !== "insertNodes");
      break;
      
    case "dojo/errors/CancelError":
    case "dojo/errors/RequestError":
    case "dojo/errors/RequestTimeoutError":
      namespace = <DojoNamespace> _.cloneDeep(namespace);
      namespace.superclass = "Error";
      namespace.properties = [
        {
          "name": "name",
          "scope": "normal",
          "types": [
                 "string"
          ],
          "from": ""
        },
        {
          "name": "message",
          "scope": "normal",
          "types": [
                 "string"
          ],
          "from": ""
        }];
      
      break;
      
    case "dojo/store/Memory":
      namespace = <DojoNamespace> _.cloneDeep(namespace);
      namespace.parameters[0].types[0] = "dojo.store._MemoryOptions";
      break;
      
    case "dojo/store/api/Store.QueryOptions":
      namespace = <DojoNamespace> _.cloneDeep(namespace);
      namespace.properties.forEach( (p) => {
        p.usage = "optional";
        if (p.name === "sort") {
          p.types.push("function");
        }
      });
      break;
      
    case "dojo/store/api/Store.SortInformation":
      namespace = <DojoNamespace> _.cloneDeep(namespace);
      namespace.properties.forEach( (p) => {
        if (p.name === "descending") {
          p.usage = "optional";
        }
      });
      break;

    // Modules which are in error or should just be ignored.  
    case "dojo/_base/url.scheme":
    case "dojo/_base/url.authority":
    case "dojo/_base/url.query":
    case "dojo/_base/url.fragment":
    case "dojo/_base/url.user":
    case "dojo/_base/url.password":
    case "dojo/_base/url.port":
    case "dojo/NodeList._nodeDataCache":
    case "dojo/_firebug/firebug":
    case "dojo/i18n.cache":
    case "dojo/dnd/common._empty":
    case "dojo/gears.available":
    case "dojo/router":
      return null;
      
    case "dijit/_editor/_Plugin.registry":
      namespace = deleteMethods(namespace, ["delete"]);
      break;
      
    default:
      break;
  }
  return namespace;
}

function containsProperty(namespace: DojoNamespace, propertyName: string): boolean {
  if (namespace.properties === undefined) {
    return false;
  }
  return namespace.properties.some( (p) => p.name === propertyName );
}

function containsMethod(namespace: DojoNamespace, methodName: string): boolean {
  if (namespace.methods === undefined) {
    return false;
  }
  return namespace.methods.some( (m) => m.name === methodName );
}

function deleteProperties(originalNamespace: DojoNamespace, propertyNames: string[]): DojoNamespace {
  if (originalNamespace.properties === undefined) {
    return originalNamespace;
  }
  const namespace = <DojoNamespace> _.cloneDeep(originalNamespace);
  namespace.properties = namespace.properties.filter( (p) => propertyNames.indexOf(p.name) === -1);
  return namespace;
}

function deleteMethods(originalNamespace: DojoNamespace, methodNames: string[]): DojoNamespace {
  if (originalNamespace.methods === undefined) {
    return originalNamespace;
  }
  const namespace = <DojoNamespace> _.cloneDeep(originalNamespace);
  namespace.methods = namespace.methods.filter( (m) => methodNames.indexOf(m.name) === -1);
  return namespace;
}


export function formatType(t: string): string {
  // This mapping below has been happily taken from
  // https://github.com/vansimke/DojoTypeDescriptionGenerator/blob/master/DojoTypeDescriptor/Scripts/app/importers/BaseImporter.ts
  // It cleans up a lot of the problems in the Dojo docs.
  let result = t;
  switch(t) {
    case "treeNode":
      result = "dijit/Tree/_TreeNode";
      break;
    case "function(row,colArg)":
      result = "{(row:Object,colArg:Object):Object";
      break;
    case "function(row,colIdx)":
      result = "{(row:Object,colIdx:number):Object";
      break;
    case "Image":
      result = "Image";
      break;
    case "Color":
      result = "dojo/_base/Color";
      break;
    case "CanvasRenderingContext2D":
      result = "CanvasRenderingContext2D";
      break;
    case "(_ConditionExpr":
      result = "dojox/grid/enhanced/plugins/filter/_ConditionExpr";
      break;
    case "DOMNode":
    case "DomNode":
    case "DOM node":
    case "Node":
    case "OomNode":
    case "Element":
    case "HTMLNode":
    case "HtmlNode":
    case "Dom":
    case "Node;":
      result = "HTMLElement";
      break;
    case "EnhancedGrid":
      result = "dojox/grid/enhanced/EnhancedGrid";
      break;
    case "Feature":
      result = "dojox/geo/openlayers/Feature";
      break;
    case "Feature[]":
      result = "dojox/geo/openlayers/Feature[]";
      break;
    case "OpenLayers.Map":
      result = "dojox/geo/openlayers/Map";
      break;
    case "Stencil":
      result = "dojox/drawing/stencil/_Base";
      break;
    case "ViewBase":
      result = "dojox/calendar/ViewBase";
      break;
    case "_Indicator":
      result = "dojox/gauges/_Indicator";
      break;
    case "_Plugin":
      result = "dojox/sketch/_Plugin";
      break;
    case "IndicatorBase":
      result = "dojox/dgauges/IndicatorBase";
      break;
    case "Rectangle":
      result = "dojox/gfx/shape.Rect";
      break;
    case "View":
      result = "dojox/app/View";
      break;
    case "_StoreLayer":
      result = "dojox/grid/enhanced/plugins/_StoreLayer._StoreLayer";
      break;
    case "__FormatOptions":
      result = "dojo/currency.__FormatOptions";
      break;
    case "HTMLFormElement":
    case "form node":
    case "form Node":
      result = "HTMLFormElement";
      break;
    case "manager.Anchor":
      result = "dojox/drawing/manager/Anchors";
      break;
    case "Point":
      result = "dojox/geo/openlayers/Point";
      break;
    case "DOMNode[]":
    case "DomNode[]":
    case "Node[]":
      result = "HTMLElement[]";
      break;
    case "Object":
    case "Object.":
    case "Object?":
    case "object":
    case "Container.__ContainerArgs":
    case "CriteriaBox":
    case "Handle":
    case "OpenLayers.Projection":
    case "StencilData":
    case "__printArgs":
    case "areaObj":
    case "request":
    case "storeObject":
    case "Moveable.__MoveableArgs":
    case "DataSource":
    case "Pointer":
    case "attributes[]":
    case "handle":
    case "point":
    case "(in":
    case "out)keywordArgs":
    case "Animation":
    case "Arguments":
    case "data item":
    case "Stream":
      result = "Object";
      break;
    case "Object...":
    case "StencilPoints":
    case "Points[]":
      result = "Object[]";
      break;
    case "Object|Anything|Nothing":
    case "Anything":
    case "Anything?":
    case "anything":
    case "any":
    case "return the plain value since it was found;":
      result = "any";
      break;
    case "Object":
    case "JSON Object":
    case "SWF":
    case "CustomEventMethod":
    case "Error object":
      result = "Object";
      break;
    case "Object[]":
      result = "Object[]";
      break;
    case "Boolean":
    case "Boolean?":
    case "Bookean":
    case "boolean":
    case "bool":
    case "boolean*":
      result = "boolean";
      break;
    case "String":
    case "string":
    case "String?":
    case "attribute-name-string":
    case "String hebrew":
    case "String hebrew year":
    case "String[2]":
    case "property":
    case "query":
    case "word":
    case "(in)string":
    case "name:":
    case "summary:":
    case "URI":
      result = "string";
      break;
    case "String[]":
    case "String...":
    case "word[]":
    case "Return an array of property names":
    case "String[]?":
      result = "string[]";
      break;
    case "Number":
    case "Number, optional":
    case "NUmber":
    case "Decimal":
    case "int":
    case "Float":
    case "float":
    case "Integer":
    case "integer":
    case "Interger":
    case "Int":
    case "id":
    case "number":
    case "sha32.outputTypes":
    case "sha64.outputTypes":
    case "Angle":
    case "CircularScale":
    case "Integer, optional":
      result = "number";
      break;
    case "Integer[]":
    case "int[]":
    case "Number[]":
    case "byte[]":
    case "Integer...":
      result = "number[]";
      break;
    case "Array":
    case "array":
    case "dojo/_base/array":
      result = "any[]";
      break;
    case "Event":
      result = "Event";
      break;
    case "Document":
    case "DocumentElement":
    case "DocumentNode":
    case "MDocumentElement":
    case "Document?":
      result = "HTMLDocument";
      break;
    case "Window":
      result = "Window";
      break;
    case "attribute":
      result = "Attr";
      break;
    case "function":
    case "Function":
    case "Class":
      result = "Function";
      break;
    case "void":
      result = "void";
      break;
    case "function[]":
    case "Function[]":
      result = "Function[]";
      break;
    case "Date":
      result = "Date";
      break;
    case "Date[]":
    case "array of dates":
    case "array of ISO dates":
      result = "Date[]";
      break;
    case "Uri":
    case "url":
      result = "URL";
      break;
    case "Nodelist":
    case "NodeList":
      result = "NodeList";
      break;
    case "TreeNode":
    case "_tree.Node":
      result = "dijit/Tree._TreeNode";
      break;
    case "Widget":
    case "_Widget":
    case "dijit/_WidgetBase?":
      result = "dijit/_WidgetBase";
      break;
    case "Widget[]":
      result = "dijit/_WidgetBase[]";
      break;
    case "Deferred":
    case "deferred":
      result = "dojo/Deferred";
      break;
    case "MenuItem":
      result = "dijit/MenuItem";
      break;
    case "ListItem":
      result = "dojox/mobile/ListItem";
      break;
    case "__SelectOption":
      result = "dijit/form/_FormSelectWidget.__SelectOption";
      break;
    case "__SelectOption[]":
      result = "dijit/form/_FormSelectWidget.__SelectOption[]";
      break;
    case "Error":
      result = "Error";
      break;
    case "function(items)":
      result = "{(items:any[])}";
      break;
    case "function(Integer, item)":
      result = "{(index:number,item:Object)}";
      break;
    case "function(items, size)":
      result = "{(items:Object[], size:number)}";
      break;
    case "Item":
    case "item":
    case "Anything":
    case "almost anything":
    case "Container.Item":
    case "value":
    case "undefined":
    case "null":
    case "Null":
    case "null)":
    case "mixed...":
    case "Nothing":
    case "Mixed":
    case "instance":
    case "jsx3.xml.Entity":
    case "Hash":
      result = "any";
      break;
    case "Anything[]":
    case "__SelectItem[]":
    case "item[]":
      result = "any[]";
      break;
    case "RegExp":
    case "RegEx":
      result = "RegExp";
      break;
    case "DOMEvent":
    case "EventObject":
    case "HTMLEvent":
      result = "Event";
      break;
    case "MouseEvent":
    case "Mouse Event":
    case "MouseEvemt":
      result = "MouseEvent";
      break;
    case "KeyboardEvent":
    case "Key Event":
      result = "KeyboardEvent";
      break;
    case "Promise?":
    case "Promise":
      result = "dojo/promise/Promise";
      break;
    case "[object Value(type: function, value: undefined)]":
      result = "{type:Function;value:any}";
      break;
    case "__Item[]":
      result = "dijit/tree/dndSource.__Item[]";
      break;
    case "data-store":
      result = "dojo/data/api/Read";
      break;
    case "dojo/query":
      result = "Function";
      break;
    case "__FormatAbsoluteOptions":
      result = "dojo/number.__FormatAbsoluteOptions";
      break;
    case "__FormatOptions":
      result = "dojo/number.__FormatOptions";
      break;
    case "__IntegerRegexpFlags":
      result = "dojo/number.__IntegerRegexpFlags";
      break;
    case "__ParseOptions":
      result = "dojo/number.__ParseOptions";
      break;
    case "__RealNumberRegexpFlags":
      result = "dojo/number.__RealNumberRegexpFlags";
      break;
    case "__RegexpOptions":
      result = "dojo/number.__RegexpOptions";
      break;
    case "dojox/dtl/__StringArgs":
      result = "string";
      break;
    case "dojox/dtl/__ObjectArgs":
      result = "Object";
      break;
    case "Array|dojo/promise/Promise":
      result = "any[]|dojo/promise/Promise";
      break;
    case "dojo/store/api/Store.AddOptions":
      result = "any";
      break;
    case "Items or ids":
      return "Item[]|string[]|number[]";
      break;
    case "Item or id":
      return "Item|string|number";
      break;
    case "String or String[]":
      return "string|string[]";
    default:
      break;
  }

  return normalizeName(result);
}
