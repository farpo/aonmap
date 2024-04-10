import { Molecule, deserializeMolecule } from "./molecule";
const molecule: Molecule = deserializeMolecule("C2/H6:CH6/CC1/:::K");
const molecule2: Molecule = deserializeMolecule("C2/H6:CH6/CC1/:::K");
const bool: boolean = molecule.compare(molecule2);
console.log(molecule);
