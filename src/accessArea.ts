import * as EthereumController from "@decentraland/EthereumController"
import * as EthConnect from "eth-connect"
import { getProvider } from "@decentraland/web3-provider"
import * as abi from './abi'
import { getUserData } from "@decentraland/Identity"
import * as crypto from '@dcl/crypto-scene-utils'

type Config = {
    name?: string,
    contract?:string,
    chain?:ChainType,
    nftType?: NFTType,
    type:Type,
    debug:boolean,
    tokenId?:string,
    transform: TranformConstructorArgs,
    wearables?:string[],
    wearablesMatch?:Match
}

export enum Type {
    NFT,
    HASWEARABLES,
    WEARABLESON
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
export async function createArea(data:Config){

    let ent = new AccessArea(data)
    engine.addEntity(ent)

    if(data.type == Type.NFT){
        log('checking nft')
        if((data.chain  == ChainType.ETH ? await checkL1(data) : await checkL2(data))){
            engine.removeEntity(ent)
        }   
    }
    else{
        log('checking wearables')
        if(await checkWearables(data)){
            engine.removeEntity(ent)
        }
    }
    return ent

}

let transparentMaterial = new BasicMaterial()
transparentMaterial.texture = new Texture("https://lsnft.mypinata.cloud/ipfs/QmaqcRuouE6Tip9acZmjxMyBftEA5aHASRDjn8Bmad87Ld")// new Texture("https://bafkreifhjkffpiz5j2z27b3o22smbp2nfvp44baoxxtumc5a3aa7nrpkn4.ipfs.nftstorage.link/")
transparentMaterial.alphaTest = 1

let debugMaterial = new Material()
debugMaterial.albedoColor = new Color4(0.2,.1, .9, .3)

class AccessArea extends Entity{

    constructor(data:Config){
        super(data.name)
        this.addComponent(new BoxShape())
        this.addComponent(new Transform(data.transform))
        if(data.debug){
            this.addComponent(debugMaterial)
            this.getComponent(BoxShape).withCollisions = false
        }
        else{
            this.addComponent(transparentMaterial)
        }
    }
}

async function checkWearables(data:Config){
    let filters:string[] = data.wearables ? data.wearables : []
    const userData = await getUserData()

    if(userData?.hasConnectedWeb3){

        if(data.type == Type.HASWEARABLES){
            let inventory = await crypto.avatar.getUserInventory(userData.publicKey ? userData.publicKey : "")
            
            if(data.wearablesMatch == Match.ANY){
                for(let i = 0; i < filters.length; i++){
                    for (const wearable of inventory) {
                        if (wearable === filters[i]) {
                            return true
                        }
                      }
                }
            }
            else{
                let count = 0
                for(let i = 0; i < filters.length; i++){
                    for (const wearable of inventory) {
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
        const provider = await getProvider();
        const requestManager: any = new EthConnect.RequestManager(provider);
        const metaProvider: any = new EthConnect.WebSocketProvider("wss://rpc-mainnet.matic.quiknode.pro");
        const address = await EthereumController.getUserAccount()
        const metaRequestManager: any = new EthConnect.RequestManager(metaProvider);
        const providers = {
          provider,
          requestManager,
          metaProvider,
          metaRequestManager,
          address,
        };

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

      } catch (error) {
       log(error)   
       return false
      }

}