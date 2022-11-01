import * as EthereumController from "@decentraland/EthereumController"
import * as EthConnect from "eth-connect"
import { getProvider } from "@decentraland/web3-provider"
import * as abi from './abi'
import { getUserData } from "@decentraland/Identity"
import * as crypto from '@dcl/crypto-scene-utils'
import * as utils from '@dcl/ecs-scene-utils'
import * as ui from '@dcl/ui-scene-utils'
import { getCurrentRealm, isPreviewMode } from "@decentraland/EnvironmentAPI"

export type Config = {
    name?: string,
    contract?:string,
    chain?:ChainType,
    nftType?: NFTType,
    type:Type,
    debug:boolean,
    tokenId?:string,
    transform: TransformConstructorArgs,
    wallType: WallType,
    wearables?:string[],
    wearablesMatch?:Match,
    allowedAddresses?:string[],
    deniedMessage?:string,
    onDenied?:() => void
}

export enum WallType {
    BOX,
    CYLINDER
}

export enum Type {
    NFT,
    HASWEARABLES,
    WEARABLESON,
    ADDRESS
}

export enum Match {
    ANY,
    ALL
}

export enum ChainType {
    ETH,
    POLYGON
}

export enum NFTType {
    ERC721,
    ERC1155
}

/**
 * @param {Config} data object with the following parameters
 * @param {string} name (optional) - define a name for the entity
 * @param {string} contract (optional) - nft contract address
 * @param {ChainType} chain (optional) - define the blockchain type (ETH or Polygon)
 * @param {NFTType} nftType (optional) - ERC 721 or ERC 1155
 * @param {Type} type - what to check for access (NFT, owns wearables, wearing wearables)
 * @param {boolean} debug - locally show / hide the Access Area
 * @param {string} tokenId (optional) - required for ERC 1155 check
 * @param {TransformConstructorArgs} transform position of the Access Area
 * @param {string[]} wearables (optional) - list of wearable contracts and item id
 * @param {Match} wearablesMatch (optional) - if the user has "ANY" or "ALL" of the wearables
 * @return {Area} Entity which can be used later
 */
export function createArea(data:Config){

    let ent:AccessArea = new AccessArea(data)
    engine.addEntity(ent)

    executeTask(async()=>{
        try{
            switch(data.type){
                case Type.NFT:
                    log('checking nft')
                    if((data.chain  == ChainType.ETH ? await checkL1(data) : await checkL2(data))){
                        log("we have nft holder")
                        engine.removeEntity(ent)
                    }   
                    break;

                case Type.ADDRESS:
                    log('checking Addresses')
                    if(data.allowedAddresses){
                        if(await checkAddress(data)){
                            engine.removeEntity(ent)
                        }
                    }
                    break;

                case Type.HASWEARABLES:
                case Type.WEARABLESON:
                    log('checking wearables')
                    if(await checkWearables(data)){
                        engine.removeEntity(ent)
                    }
                    break;
            }
        }
        catch(e){
    
        }
    })
    return ent
}

let transparentMaterial = new BasicMaterial()
transparentMaterial.texture = new Texture("https://lsnft.mypinata.cloud/ipfs/QmaqcRuouE6Tip9acZmjxMyBftEA5aHASRDjn8Bmad87Ld")// new Texture("https://bafkreifhjkffpiz5j2z27b3o22smbp2nfvp44baoxxtumc5a3aa7nrpkn4.ipfs.nftstorage.link/")
transparentMaterial.alphaTest = 1

let debugMaterial = new Material()
debugMaterial.albedoColor = new Color4(0.2,.1, .9, .3)

class AccessArea extends Entity{

    data:Config

    constructor(data:Config){
        super(data.name)
        this.data = data

        switch(this.data.wallType){
            case WallType.BOX:
                this.addComponent(new BoxShape())
                break;

            case WallType.CYLINDER:
                this.addComponent(new CylinderShape())
                break;
        }
        this.addComponent(new Transform(data.transform))

        executeTask(async()=>{
            if(data.debug && await isPreviewMode()){
                this.addComponent(debugMaterial)
                switch(this.data.wallType){
                    case WallType.BOX:
                        this.getComponent(BoxShape).withCollisions = false                        
                        break;
        
                    case WallType.CYLINDER:
                        this.getComponent(CylinderShape).withCollisions = false
                        break;
                }
            }
            else{
                this.addComponent(transparentMaterial)
            }
        })

        let t = this.getComponent(Transform).scale.clone()
        this.addComponent(new utils.TriggerComponent(new utils.TriggerBoxShape(new Vector3(t.x + .7, t.y + .7, t.z + .7), new Vector3(0,0,0)),
        {
            enableDebug: false,
            onCameraEnter:()=>{
                if(data.deniedMessage){
                    ui.displayAnnouncement(data.deniedMessage)
                }

                if(data.onDenied){
                    data.onDenied()
                }
            }
        }))
    }

    updateDeniedAction(action:()=>void){
        this.data.onDenied = action
    }

    updateDeniedMessage(message:string){
        this.data.deniedMessage = message
    }
}

async function checkAddress(data:Config){
    const userData = await getUserData()

    if(userData?.hasConnectedWeb3){
        let addresses:string[] = []
        for(let i = 0; i < data.allowedAddresses!.length; i++){
            addresses.push(data.allowedAddresses![i].toLowerCase())
        }

        if(addresses.indexOf(userData.publicKey!.toLowerCase()) != -1){
            return true
        }
        else{
            return false
        }
    }
    else{
        return false
    }
}

async function checkWearables(data:Config){
    let filters:string[] = data.wearables ? data.wearables : []
    const userData = await getUserData()

    if(userData?.hasConnectedWeb3){
        log('we are here')

        if(data.type == Type.HASWEARABLES){
            log('getting inventory')

            try {
                let player = await getUserData()
                const playerRealm = await getCurrentRealm()

                let url = `https://peer.decentral.io/lambdas/collections/wearables-by-owner/${userData.userId}`.toString()
                log("using URL: ", url)
            
            
                let response = await fetch(url)
                let json = await response.json()
                let inventory = json

                if(data.wearablesMatch == Match.ANY){
                    log('matching any')
                    for(let i = 0; i < filters.length; i++){
                        for (const wearable of inventory) {
                            if (wearable.urn === filters[i]) {
                                return true
                            }
                          }
                    }
                }
                else{
                    let count = 0
                    for(let i = 0; i < filters.length; i++){
                        for (const wearable of inventory) {
                            if (wearable.urn === filters[i]) {
                                count++
                            }
                          }
                    }
                    if(count >= filters.length){
                        return true
                    }
                    else{
                        return false
                    }   
                }
            
              } catch {
                log("an error occurred while reaching for wearables data")
                return false
              }
        }

        else{
            log('Currently wearing: ', userData.avatar.wearables)
            if(data.wearablesMatch == Match.ANY){
                for(let i = 0; i < filters.length; i++){
                    for (const wearable of userData.avatar.wearables) {
                        if (wearable === filters[i]) {
                            return true
                        }
                      }
                }
            }
            else{
                let count = 0
                for(let i = 0; i < filters.length; i++){
                    for (const wearable of userData.avatar.wearables) {
                        if (wearable === filters[i]) {
                            count++
                        }
                      }
                }
                if(count >= filters.length){
                    return true
                }
                else{
                    return false
                }
            }

        }
    }
    else{
        return false
    }

}

async function checkL2(data:Config){
    try{
        log('checking L2 nft')

        const provider = await getProvider()
        const requestManager: any = new EthConnect.RequestManager(provider)
        const metaProvider: any = new EthConnect.HTTPProvider('https://polygon-rpc.com')
        const address = await EthereumController.getUserAccount()
        const metaRequestManager: any = new EthConnect.RequestManager(metaProvider)
        const providers = {
        requestManager,
        metaProvider,
        metaRequestManager
            }

        let contract: any = await new EthConnect.ContractFactory(metaRequestManager,data.nftType == NFTType.ERC721 ? abi.abi721 : abi.abi1155 ).at(data.contract ? data.contract : "");
        let value:any
        if(data.tokenId){
            if(data.nftType == NFTType.ERC721){
                value = await contract.ownerOf(data.tokenId)
                if(value.toLowerCase() == address.toLowerCase()){
                    return true
                }
                else{
                    return false
                }
            }
            else{
                value = await contract.balanceOf(address, data.tokenId)
                log('L2 balance of is', value)
                if(value > 0){
                    return true
                }
                else{
                    return false
                }
            }

        }
        else{
            value = await contract.balanceOf(address)
            log('L2 balance of is', value)
            if(value > 0){
                return true
            }
            else{
                return false    
            }
        }
    }
    catch(e){
        log(e)
        return false
    }
}

async function checkL1(data:Config){
    log('checking L1 ownership')
    log(data)
    try {
        const address = await EthereumController.getUserAccount()
        const provider = await getProvider()
        const requestManager = new EthConnect.RequestManager(provider)
        const factory = new EthConnect.ContractFactory(requestManager, data.nftType == NFTType.ERC721 ? abi.abi721 : abi.abi1155)
        const contract = (await factory.at(data.contract ? data.contract : "")) as any

        let value:any
        if(data.tokenId){
            if(data.nftType == NFTType.ERC721){
                value = await contract.ownerOf(data.tokenId)
                if(value.toLowerCase() == address.toLowerCase()){
                    return true
                }
                else{
                    return false
                }
            }
            else{
                value = await contract.balanceOf(address, data.tokenId)
                log('L1 balance of is', value)
                if(value > 0){
                    return true
                }
                else{
                    return false
                }
            }

        }
        else{
            value = await contract.balanceOf(address)
            log('L1 balance of is', value)
            if(value > 0){
                return true
            }
            else{
                return false
            }
        }

      } catch (error) {
       log(error)   
       return false
      }

}