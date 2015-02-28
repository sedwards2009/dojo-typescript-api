# dojo-typescript-api
Converts the [Dojo](http://dojotoolkit.org/) API into a .d.ts definition files for use with TypeScript.

# How does it work?
This is fairly small TypeScript program which runs on modern node/iojs versions. It reads the `details.json` file output from [js-doc-parse](https://github.com/wkeese/js-doc-parse) and outputs a TypeScript definition file.

# Running it

* Have [iojs](https://iojs.org) installed. Nodejs >= 0.12 probably works too but I haven't tried it.
* After cloning this repo do a `npm install` to grab the needed modules.
* `npn run make` builds the software.
* `npn run run` runs the generator itself.
* The generated output it just being thrown up onto the console at the moment.

The `details.json` file for Dojo 1.10 is already included in the `data` directory.

# Goals
* Produce working definition files for Dojo. It remains yet to be proven whether this can be achieved in a practical way.
* No manual modifications to the output. All parts of the conversion process must be automated and fully repeatable.
* Hackable code base. It should be easy for people to get involved and improve it.

# Related work
* [DojoTypeDescriptionGenerator](https://github.com/vansimke/DojoTypeDescriptionGenerator) is also a converter which parses the API HTML documentation to extract the needed information. It is discontinued, but still has some useful code.
* [dojo-typescript-class](https://github.com/sedwards2009/dojo-typescript-class) is a related project which tries to integrate Dojo's classes with TypeScript's classes such that Dojo classes can be extended using TypeScript's class syntax and vice versa.

----
Simon Edwards

Email: simon@simonzone.com

github: https://github.com/sedwards2009
