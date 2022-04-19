/// <reference types="env" />
/// <reference types="dcl" />
declare type Config = {
    name?: string;
    contract?: string;
    chain?: ChainType;
    nftType?: NFTType;
    type: Type;
    debug: boolean;
    tokenId?: string;
    transform: TranformConstructorArgs;
    wearables?: string[];
    wearablesMatch?: Match;
};
export declare enum Type {
    NFT = 0,
    HASWEARABLES = 1,
    WEARABLESON = 2
}
export declare enum Match {
    ANY = 0,
    ALL = 1
}
export declare enum ChainType {
    ETH = 0,
    POLYGON = 1
}
export declare enum NFTType {
    ERC721 = 0,
    ERC1155 = 1
}
export declare function createArea(data: Config): Promise<AccessArea>;
declare class AccessArea extends Entity {
    constructor(data: Config);
}
export {};
