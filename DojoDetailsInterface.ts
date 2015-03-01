export interface DojoParameter {
  name: string;
  types: string[];
  usage: string;
  summary?: string;
}

export interface DojoProperty {
  name: string;
  scope: string;
  types: string[];
  from: string;
}

export interface DojoMethod {
  name: string;
  scope: string;
  from: string;
  parameters: DojoParameter[];
  returnTypes: string[];
  summary: string;
  description: string;
  examples: string;
}

export interface DojoNamespace {
  location: string;
  type: string;
  classlike?: boolean;
  superclass?: string;
  parameters?: DojoParameter[];
  returnTypes: string[];
  summary: string;
  description: string;
  examples: string;
  properties?: DojoProperty[];
  methods?: DojoMethod[];
}

export interface DojoDetailsInterface {
  [namespacePath: string]: DojoNamespace;
};
