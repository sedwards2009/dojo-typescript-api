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
  usage?: string;
  extensionModule?: boolean;
}

export interface DojoDocumentedEntity {
  parameters?: DojoParameter[];
  returnDescription?: string;
  returnTypes: string[];
  summary: string;
  description?: string;
  examples?: string;
}

export interface DojoMethod extends DojoDocumentedEntity {
  name: string;
  scope: string;
  from: string;  
  extensionModule?: boolean;
}

export interface DojoNamespace extends DojoDocumentedEntity {
  location: string;
  type: string;
  classlike?: boolean;
  superclass?: string;
  properties?: DojoProperty[];
  methods?: DojoMethod[];
}

export interface DojoDetailsInterface {
  [namespacePath: string]: DojoNamespace;
};
