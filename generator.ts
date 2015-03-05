/// <reference path="typings/tsd.d.ts" />
"use strict";
import stream = require('stream');

import DojoDetailsInterface = require('./DojoDetailsInterface');

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

export function formatAPI(details: DojoDetailsInterface): string {
  let result = "";
  for (let key in details) {
    result += formatModule(details[key]);
  }
  return result;
}

function formatModule(namespace: DojoNamespace, level: number=0): string {
  let result = "";
  let resultTail = "";

  /*log("Location: " + namespace.location + "\n");*/
  const name = namespace.location;
  const parts = normalizeName(name).split(/\./g);

  parts.slice(0, -1).forEach( (p) => {
      result += indent(level) + (level === 0 ? "declare " : "") + "module " + p + " {\n";
      resultTail = indent(level) + "}\n" + resultTail;
      level++;
    });
    
  const lastPart = parts[parts.length-1];
  
  // Types which start with __ are Dojo's (fake) way of documenting interfaces.
  const isDojoInterface = lastPart.indexOf("__") === 0;
  
  // Objects acting as namespaces and containing functions.
  if (namespace.type === 'object' || namespace.type === 'instance' || isDojoInterface) {
    result += formatNamespaceObject(namespace, level);
    
  } else if (namespace.type === 'function') {
    result += formatFunction(namespace, level);
    
    if (namespace.methods !== undefined && namespace.methods.some( (m) => m.name === 'constructor' )) {
      result += formatNamespaceObject(namespace, level);
    }
  } else if (namespace.type === 'constructor' && namespace.classlike) {
    // Class
    result += formatClass(namespace, level);
  }

  const interfaceName = translateInterfaceName(namespace.location);
  resultTail += `declare module "${namespace.location}" {
  var exp: ${interfaceName};
  export = exp;
}
`;
  return result + resultTail;
}

function formatNamespaceObject(namespace: DojoNamespace, level: number): string {
  let result = "";
  let resultTail = "";
  const name = namespace.location;
  const parts = normalizeName(name).split(/\./g);

  result += indent(level) + "interface " + translateInterfaceName(parts[parts.length-1]) + " {\n";
  resultTail = indent(level) + "}\n" + resultTail;

  level++;
  if (namespace.properties !== undefined) {
    result += formatProperties(namespace.properties, level);
  }

  if (namespace.methods !== undefined) {
    result += formatMethods(namespace.methods, level);
  }
  return result + resultTail;
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
  result += indent(level) + "(" + formatParameters(namespace.parameters) + "): " +
    formatReturnTypes(namespace.returnTypes) + ";\n";

  return result + resultTail;
}

function formatClass(namespace: DojoNamespace, level: number): string {
  let result = "";
  let resultTail = "";
  const name = namespace.location;
  const parts = normalizeName(name).split(/\./g);

  result += indent(level) + "class " + translateInterfaceName(parts[parts.length-1]);
  if (namespace.superclass !== undefined && namespace.superclass !== "") {
    result += " implements " + formatType(namespace.superclass);
  }
  result += " {\n";
  resultTail = indent(level) + "}\n" + resultTail;

  level++;

  result += indent(level) + "constructor(" + (namespace.parameters !== undefined ? formatParameters(namespace.parameters) : "") + ");\n\n";

  if (namespace.properties !== undefined) {
    result += formatProperties(namespace.properties, level);
  }

  if (namespace.methods !== undefined) {
    result += formatMethods(namespace.methods, level);
  }

  return result + resultTail;
}

function normalizeName(name: string): string {
  return name.split(/\//g).join(".");
}

function translateInterfaceName(name: string): string {
  const parts = name.split("/");
  if (parts[parts.length-1] === "string") {
    parts[parts.length-1] = "string_";
  }

  return parts.join(".");
}

function formatProperties(properties: DojoProperty[], level: number): string {
  return properties.map( (prop) => indent(level) + prop.name + ": " + formatTypes(prop.types) + ";\n\n").join("");
}

function formatMethods(methods: DojoMethod[], level: number): string {
  return methods.map( (method) => formatMethod(method, level)).join("\n");
}

function formatMethod(method: DojoMethod, level: number): string {
  if (method.name === 'constructor') {
    return formatDocs(method, level) +
      indent(level) + method.name + "(" + formatParameters(method.parameters) + ");";
  } else {
    return formatDocs(method, level) +
      indent(level) + method.name + "(" + formatParameters(method.parameters) + "): " +
      formatReturnTypes(method.returnTypes) + ";\n";
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
        (param.summary !== undefined ? htmlToPlainLines(param.summary).join("\n" + docIndent + "          ") + "\n" : "")).join("");
  }
  result += indent(level) + " */\n";
  return result;
}

function htmlToPlainLines(text: string): string[] {
  const parts = text.split("\n");
  return parts.map( (t) => t.trim() ).filter( (t) => t !== "").map(stripHtml);
}

function stripHtml(text: string): string {
  return text.replace(/<p>/g, "").replace(/<\/p>/g, "");
}

function prefixLines(lines: string[], prefix: string): string[] {
  return lines.map( (line) => prefix + line);
}

function formatParameters(parameters: DojoParameter[]): string {
  return parameters.map(formatParameter).join(", ");
}

function formatParameter(parameter: DojoParameter): string {
  return parameter.name + (parameter.usage === "optional" ? "?" : "") + ": " + formatTypes(parameter.types);
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
      result = "Object";
      break;
    case "Object...":
    case "StencilPoints":
    case "Points[]":
      result = "Object[]";
      break;
    case "Anything":
    case "anything":
    case "any":
    case "return the plain value since it was found;":
      result = "any";
      break;
    case "Object":
    case "SWF":
    case "CustomEventMethod":
    case "Error object":
      result = "Object";
      break;
    case "Object[]":
      result = "Object[]";
      break;
    case "Boolean":
    case "Bookean":
    case "boolean":
    case "bool":
    case "boolean*":
      result = "boolean";
      break;
    case "String":
    case "string":
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
      result = "string";
      break;
    case "String[]":
    case "String...":
    case "word[]":
    case "Return an array of property names":
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
      result = "any[]";
      break;
    case "Event":
      result = "Event";
      break;
    case "Document":
    case "DocumentElement":
    case "DocumentNode":
    case "MDocumentElement":
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
    default:
      break;
  }

  return normalizeName(result);
}
