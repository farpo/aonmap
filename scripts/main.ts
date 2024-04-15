import {
  world,
  system,
  WorldBeforeEvents,
  World,
  Vector3,
  DimensionLocation,
  Dimension,
  ScriptEventSource,
  EntityQueryOptions,
  Entity
} from "@minecraft/server";
import { Molecule, deserializeMolecule } from "./molecule.js";
import { scanMoleculeAt } from "./areamolscanner.js";
import { MinecraftBiomeTypes, MinecraftBlockTypes, MinecraftEntityTypes } from "@minecraft/vanilla-data";
//Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
//np run local-deploy
function mainTick() {
  system.run(mainTick);
}
function interpretLocation(string: string): Vector3 {
  const stringArray: string[] = string.split(":");
  const x: number = Number(stringArray[0]);
  const y: number = Number(stringArray[1]);
  const z: number = Number(stringArray[2]);
  return { x: x, y: y, z: z };
}
function checkMolecule(startingPos: Vector3, molecule: string, dimension: Dimension | undefined): boolean {
  if (typeof dimension === "undefined") {
    return false;
  }
  let wantedMolecule: Molecule = deserializeMolecule(molecule);
  let builtMolecule: Molecule = scanMoleculeAt(startingPos, 15, dimension);
  return wantedMolecule.compare(builtMolecule);
}
function getRandomPosInXZSquare(minX:number, minZ:number, maxX:number, maxZ:number, y:number):Vector3{
  const x: number = randomIntFromInterval(minX, maxX);
  const z: number = randomIntFromInterval(minZ, maxZ);
  return {x:x, y:y, z:z};
}
function randomIntFromInterval(min:number, max:number):number { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min)
}
//Run inits
world.beforeEvents.chatSend.subscribe((eventdata) => {
  if (eventdata.message === "yete") {
    world.sendMessage("moo");
    eventdata.cancel = true;
  }
});
function checkAllEntitiesFooting(dim:Dimension, entites:Entity[], wantedFooting:string){
  for (let i = 0; i < entites.length; i++) {
    let entity : Entity = entites[i];
    const footingPos : Vector3 = {x:Math.floor(entity.location.x), y:Math.floor(entity.location.y) - 1, z:Math.floor(entity.location.z)}
    world.sendMessage("footing pos y: " + footingPos.y + " footing: " + dim.getBlock(footingPos)?.type.id);
    if(dim.getBlock(footingPos)?.type.id !== "minecraft:" + wantedFooting){
      world.sendMessage("false: " + "minecraft:" + wantedFooting);

      return false;
    }
  }
  return true;
}
system.afterEvents.scriptEventReceive.subscribe((eventData) => {
  const dimension: Dimension | undefined =
      eventData.sourceType === ScriptEventSource.Block
        ? eventData.sourceBlock?.dimension
        : eventData.sourceEntity?.dimension;
  if (eventData.id === "aon:molscan") {
    const stringArray: string[] = eventData.message.split(";");
    const initPos: Vector3 = interpretLocation(stringArray[0]);
    const redstoneBlockPos: Vector3 = interpretLocation(stringArray[1]);
    
    const bool: boolean = checkMolecule(initPos, stringArray[2], dimension);
    //world.sendMessage(String(bool));

    if (bool) {
      dimension?.runCommandAsync(
        "setblock " + redstoneBlockPos.x + " " + redstoneBlockPos.y + " " + redstoneBlockPos.z + " redstone_block"
      );
    }
  } else if (eventData.id === "aon:placeAvalancheBlocks"){
    const stringArray: string[] = eventData.message.split(":");
    const minX: number = Number(stringArray[0]);
    const minZ: number = Number(stringArray[1]);
    const maxX: number = Number(stringArray[2]);
    const maxZ: number = Number(stringArray[3]);
    const y: number = Number(stringArray[4]);
    const amount: number = Number(stringArray[5]);
    const blockType: string = stringArray[6];
    for (let i = 0; i < amount; i++) {
      const randomPos: Vector3 = getRandomPosInXZSquare(minX, minZ, maxX, maxZ, y);
      dimension?.runCommandAsync(
        "setblock " + randomPos.x + " " + randomPos.y + " " + randomPos.z + " " + blockType
      );    
    }
  } else if (eventData.id === "aon:spawnMultipleEntities"){
    const stringArray: string[] = eventData.message.split(":");
    const x: number = Number(stringArray[0]);
    const y: number = Number(stringArray[1]);
    const z: number = Number(stringArray[2]);
    const amount: number = Number(stringArray[3]);
    const entityType :string = stringArray[4];
    for (let i = 0; i < amount; i++) {
      dimension?.runCommandAsync(
        "summon " + entityType + " " + x + " " + y + " " + z
      );    
    }
  } else if (eventData.id === "aon:checkEntityAmountAndFooting"){
    const stringArray: string[] = eventData.message.split(":");
    const entityType : string = stringArray[0];
    const wantedAmount : number = Number(stringArray[1]);
    const wantedFooting: string = stringArray[2];
    const x: number = Number(stringArray[3]);
    const y: number = Number(stringArray[4]);
    const z: number = Number(stringArray[5]);
    let entites:Entity[] | undefined = dimension?.getEntities({type:entityType});
    if(typeof entites !== "undefined" && typeof dimension !== "undefined"){
      world.sendMessage("entities: " + entites.length)
      if(entites.length === wantedAmount){
        if(checkAllEntitiesFooting(dimension, entites, wantedFooting)){
          dimension.runCommandAsync(
            "setblock " + x + " " + y + " " + z +  " redstone_block"
          );         
        }
      }
    }
  }
});

system.run(mainTick);
